import * as ts from "typescript"
import fs from 'node:fs'
import * as path from 'node:path'
import prettier from 'prettier'
import { exec } from 'child_process';

type ClassDecl = {
	name: string, 
	members: FunctionDecl[]
}

type FunctionDecl = {
	name: string,
	parameters: { name: string, type: string }[],
	returnType: string
}
	
function getClasses() {
	const classes: ClassDecl[] = []

	const files = fs.readdirSync('./templates/api/apis/').filter(file => file.endsWith('.ts'))

	files.forEach(file => {
		const sourceFile = ts.createSourceFile(
			file,
			fs.readFileSync(path.join('./templates/api/apis/', file)).toString(),
			ts.ScriptTarget.ES2015,
			true
		)

		function visit(node: ts.Node) {
			if (ts.isClassDeclaration(node) && node.name) {
				const className = node.name.text
				const members = node.members
					.filter(member => ts.isMethodDeclaration(member) || ts.isPropertyDeclaration(member))
					.map(member => {
						if (ts.isMethodDeclaration(member) && member.name) {
							const parameters = member.parameters
								.slice(0, -1)
								.map(param => ({
									name: param.name.getText(),
									type: param.type ? param.type.getText() : 'any'
								}))
							const returnType = member.type ? member.type.getText() : 'any'
							return { name: member.name.getText(), parameters, returnType }
						} else if (ts.isPropertyDeclaration(member) && member.name) {
							return { name: member.name.getText(), parameters: [], returnType: 'any' }
						}
					})
					.filter(member => member !== undefined)
					.filter(member => !member!.name.endsWith('Raw')) as FunctionDecl[]

				classes.push({ name: className, members })
			}
			ts.forEachChild(node, visit)
		}

		visit(sourceFile)
	})

	return classes
}

function createQueryApi(classes: ClassDecl[]) {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

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
                    ? ts.factory.createTypeReferenceNode(member.parameters[0].type, undefined)
                    : ts.factory.createTupleTypeNode(member.parameters.map(param => ts.factory.createTypeReferenceNode(param.type, undefined)));

            // Создаем параметр args
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

            // Создаем тело функции
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

            // Создаем объявление метода
            return ts.factory.createMethodDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier(member.name),
                undefined,
                undefined,
                [argsParameter],
                ts.factory.createTypeReferenceNode(member.returnType, undefined),
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

    const resultFile = ts.factory.updateSourceFile(sourceFile, [classDeclaration])

    return printer.printFile(resultFile)
}

const code = createQueryApi(getClasses())
const formattedCode = await prettier.format(code, { parser: "typescript" })

const filePath = path.join(__dirname, './templates/QueryApi.ts');

try {
	await fs.promises.writeFile(filePath, formattedCode);
	console.log(`Saved file: ${filePath}`);
} catch (err) {
	console.error("Error on write:", err);
}

exec(`bun eslint --fix ${filePath}`)