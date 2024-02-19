import { Cases, Results } from "./types"
import * as fs from 'fs';

export const getCasesFromTestRailJson = (filePath: string): Cases => {
    return readJsonFile(filePath) as Cases;
}

export const writeCasesToTestRailJson = (filePath: string, cases: Cases) => {
    writeToJsonFile(filePath, JSON.stringify(cases));
}

export const writeResultsToTestRailJson = (filePath: string, results: Results) => {
    writeToJsonFile(filePath, JSON.stringify(results));
}

const readJsonFile = (filePath: string):object => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (err) {
        return {};
    }
};

const writeToJsonFile = (filePath:string, data:string) => {
    try {
        fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error writing file:', err);
    }
};

export default { getCasesFromTestRailJson,writeResultsToTestRailJson, writeCasesToTestRailJson }