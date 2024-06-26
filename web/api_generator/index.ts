import process from 'process'
import { generateResultCode, moveFiles, runEslint, writeToFile } from './generateCode';
import * as path from 'node:path'

//После раста я влюбился в кодогенерацию, но не в такую...
//@Generated by neural network
const args = process.argv.slice(2);

if (args.includes('--help')) {
    console.log(`
    This script generates a wrapper for rtk-query over an API that is generated using openapi-generator.
    Usage: bun index.ts [react|vue]
    `);
    process.exit(0);
}

if (args.length === 0) {
    console.error('Please provide "react" or "vue" as an argument');
    process.exit(1);
}

const arg = args[0];

if (arg !== 'react' && arg !== 'vue') {
    console.error(`Unknown argument: ${arg}. Please provide "react" or "vue"`);
    process.exit(1);
} 

const formattedCode = await generateResultCode();
const filePath = path.join(__dirname, './dist/QueryApi.ts');
const configPath = path.join(__dirname, './.eslintrc.js');


await writeToFile(filePath, formattedCode);
await runEslint(filePath, configPath);
await moveFiles(arg);