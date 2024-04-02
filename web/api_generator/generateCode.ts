import * as ts from "typescript"
import fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import util from 'node:util'
import fsExtra from 'fs-extra'
const exec = util.promisify(require('node:child_process').exec);

export type ClassDecl = {
	name: string, 
	members: FunctionDecl[]
}

export type FunctionDecl = {
	name: string,
	parameters: { name: string, type: ts.TypeNode }[],
	returnType: ts.TypeNode
}
	
export function getClasses() {
	const classes: ClassDecl[] = []

	const files = fs.readdirSync('./dist/api/apis/').filter(file => file.endsWith('.ts'))

	files.forEach(file => {
		const sourceFile = ts.createSourceFile(
			file,
			fs.readFileSync(path.join('./dist/api/apis/', file)).toString(),
			ts.ScriptTarget.ES2015,
			true
		)

		function collectClassesWithMethodsDeclarations(node: ts.Node) {
			if (ts.isClassDeclaration(node) && node.name) {
				const className = node.name.text
				const members = node.members
					.filter(member => ts.isMethodDeclaration(member))
					.map(member => {
						if (ts.isMethodDeclaration(member) && member.name) {
							const parameters = member.parameters
								.slice(0, -1)
								.map(param => ({
									name: param.name.getText(),
									type: param.type ? param.type : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
								}))
							
							//Promise<T> => T
							let returnType = member.type ? member.type : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)

							if (ts.isTypeReferenceNode(returnType) && returnType.typeName.getText() === 'Promise' && returnType.typeArguments) {
								returnType = returnType.typeArguments[0];
							}

							return { name: member.name.getText(), parameters, returnType }
						} else if (ts.isPropertyDeclaration(member) && member.name) {
							return { name: member.name.getText(), parameters: [], returnType: ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword) }
						}
					})
					.filter(member => member !== undefined)
					.filter(member => !member!.name.endsWith('Raw')) as FunctionDecl[]
		
				classes.push({ name: className, members })
			}
			ts.forEachChild(node, collectClassesWithMethodsDeclarations)
		}


		collectClassesWithMethodsDeclarations(sourceFile)
	})

	return classes
}

export function createQueryApi(classes: ClassDecl[]) {

	const sourceFile = ts.createSourceFile(
		"QueryApi.ts",
		"",
		ts.ScriptTarget.Latest,
		false,
		ts.ScriptKind.TS
	)
	
	const methods = classes.flatMap(classDecl =>
		classDecl.members.map(member => {
			
			const argsType: ts.TypeNode = member.parameters.length === 0 
				? ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
				: member.parameters.length === 1 
					? member.parameters[0].type
					: ts.factory.createTupleTypeNode(member.parameters.map(param => param.type));

			/*
				variants of args decl:
					* args: () => ${member.parameter.type} // if member.parameters.length === 1 
					* args: () => [${...member.parameters.type}]
					* args: () => undefined = () => {} // if member.parameters.length === 0
			*/
			const argsParameter = ts.factory.createParameterDeclaration(
				undefined,
				undefined,
				ts.factory.createIdentifier("args"),
				undefined,
				ts.factory.createFunctionTypeNode(
					undefined,
					[],
					argsType
				),
				member.parameters.length === 0 ? ts.factory.createArrowFunction(
					undefined,
					undefined,
					[],
					undefined,
					ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
					ts.factory.createBlock([], false)
				) : undefined
			);

			/*
				return this._useQuery(
					() => this.options.apiFactory.create(index.${classDecl.name}),
					${classDecl.name}.prototype.${classDecl.member.name},
					args,
				)
			*/
			const body = ts.factory.createBlock([
				ts.factory.createReturnStatement(
					ts.factory.createCallExpression(
						ts.factory.createPropertyAccessExpression(
							ts.factory.createThis(),
							ts.factory.createIdentifier("_useQuery")
						),
						undefined,
						[
							ts.factory.createArrowFunction(
								undefined,
								undefined,
								[],
								undefined,
								ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
								ts.factory.createCallExpression(
									ts.factory.createPropertyAccessExpression(
										ts.factory.createPropertyAccessExpression(
											ts.factory.createThis(),
											ts.factory.createIdentifier("options")
										),
										ts.factory.createIdentifier("apiFactory.create")
									),
									undefined,
									[ts.factory.createIdentifier(classDecl.name)]
								)
							),
							ts.factory.createPropertyAccessExpression(
								ts.factory.createPropertyAccessExpression(
									ts.factory.createIdentifier(classDecl.name),
									ts.factory.createIdentifier("prototype")
								),
								ts.factory.createIdentifier(member.name)
							),
							ts.factory.createIdentifier("args")
						]
					)
				)
			], true);


			/*
				${classDecl.member.name}(${argsParameter}): {
					query: UseQueryReturnType<${member.returnType}, ApiError>;
					remove: () => void;
				} {
					return this._useQuery(
						() => this.options.apiFactory.create(index.${classDecl.name}),
						${classDecl.name}.prototype.${classDecl.member.name},
						args,
					)
				}
			*/
			return ts.factory.createMethodDeclaration(
				undefined,
				undefined,
				ts.factory.createIdentifier(member.name),
				undefined,
				undefined,
				[argsParameter],
				ts.factory.createTypeReferenceNode(
					"UseQueryReturnWrapperType",
					[member.returnType]
				),
				body
			);
		})
	)

	const classDeclaration = ts.factory.createClassDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DefaultKeyword)],
		"QueryApi",
		[
			ts.factory.createTypeParameterDeclaration(undefined, "TResult"),
			ts.factory.createTypeParameterDeclaration(
				undefined, 
				"TQueryHooksAPIBuilderOptions", 
				undefined, 
				ts.factory.createTypeReferenceNode("ApiUseQueryOptions", [
					ts.factory.createTypeReferenceNode("TResult", [])
				])
			)
		],
		[ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [ts.factory.createExpressionWithTypeArguments(
			ts.factory.createIdentifier("BaseQueryApi"),
			[
				ts.factory.createTypeReferenceNode("TResult", []),
				ts.factory.createTypeReferenceNode("TQueryHooksAPIBuilderOptions", [])
			]
		)])],
		methods
	)

	return ts.factory.updateSourceFile(sourceFile, [classDeclaration])
}


export async function generateResultCode() {

    const classes = getClasses()

    const primitiveTypes = ["any", "unknown", "boolean", "number", "string", "symbol", "void", "null", "undefined"];

    const types = new Set(classes.flatMap(classDecl =>
        classDecl.members.flatMap(member => {
            return [
                ...member.parameters.map(param => param.type.getText()),
                member.returnType.getText()
            ]
        })
    ).filter(type => !primitiveTypes.includes(type)));

    const classNames = classes.map(classDecl => classDecl.name).join(', ');
	const typeNames = Array.from(types).length > 0 ? `, ${Array.from(types).map(type => 'type ' + type).join(', ')}` : '';

    const source = createQueryApi(classes)
    const code = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(source)
    const codeWithImports = `
/* tslint:disable */
/* eslint-disable */

import BaseQueryApi, { type ApiUseQueryOptions, type UseQueryReturnWrapperType } from "./BaseQueryApi";
import { ${classNames}${typeNames} } from "./api/index";

${code}
    `;

    const formattedCode = await prettier.format(codeWithImports, { parser: "typescript", useTabs: true })

    return formattedCode;
}


export async function writeToFile(filePath: string, formattedCode: string) {
    try {
        await fs.promises.writeFile(filePath, formattedCode);
        console.log(`Saved file: ${filePath}`);
    } catch (err) {
        console.error("Error on write:", err);
    }
}

export async function runEslint(filePath: string, configPath: string) {
    try {
        await exec(`bun eslint --config ${configPath} --fix ${filePath}`, { cwd: '/logs' });
    } catch (error) {
        console.log(error);
    }
}

async function generateBaseQueryApiTemplate(type: Type) {
	
    let template = await fs.promises.readFile(path.join(__dirname, './templates/BaseQueryApi.template'), 'utf-8');

    let importPath = '';
	
    if (type === 'react') {
        importPath = "'@tanstack/react-query'";
    } else if (type === 'vue') {
        importPath = "'@tanstack/vue-query'";
    }

    const result = template.replace('#importPath', importPath);

    return result;
}


export type Type = 'react' | 'vue';

export async function moveFiles(type: Type) {
    try {
        await fsExtra.copy('./dist', '../src/Api', { overwrite: true });
        await fsExtra.copy('./templates/ApiFactory.ts', '../src/Api/ApiFactory.ts', { overwrite: true });

		
        const baseQueryApiContent = await generateBaseQueryApiTemplate(type);

        await fs.promises.writeFile(path.join(__dirname, '../src/Api/BaseQueryApi.ts'), baseQueryApiContent);

        console.log('Successfully moved files.');
    } catch (err) {
        console.error('Error on moving the folder:', err);
    }
}