import { Cases, CaseResult, TestResult, Results } from "./types";

export const getCaseIDsFromTags = async (tags: string[]): Promise<Array<number>> => {
    const testCaseTags = await Promise.all(tags.filter((tag) => tag.match(/^@C\d(\d+)$/)));
    const caseIDs: Array<number> = [];
    String(testCaseTags)
        .split(",")
        .forEach((testCase) => {
            if (testCase != "")
                caseIDs.push(Number(testCase.replace("@C", "").trim()));
        });
    return caseIDs;
};

export const getCaseIDsFromTitle = async (title: string): Promise<Array<number>> => {
    const caseIds: Array<number> = [];
    const testCaseIdRegExp = /\bT?C(\d+)\b/g;
    let m: string[] | null;
    while ((m = testCaseIdRegExp.exec(title)) !== null) {
        const caseId = parseInt(m[1]);
        caseIds.push(caseId);
    }
    return caseIds;
}

export const getResultsPayload = async (cases: Cases): Promise<Results> => {
    const caseIDs = Object.keys(cases)
    const testResults: TestResult[] = []
    for (let i = 0; i < caseIDs.length; i++) {
        const caseID = caseIDs[i];
        const caseResult: CaseResult = cases[caseID];
        const testResult: TestResult = {
            case_id: Number(caseID),
            status_id: caseResult.passed ? 1 : 5,
            comment: caseResult.comment
        }
        testResults.push(testResult)
    }
    return { results: testResults }
}

export const getCaseResultsJson = async (cases: Cases, caseIDs: number[], passed: boolean, comment: string): Promise<Cases> => {
    for (let i = 0; i < caseIDs.length; i++) {
        const caseID = caseIDs[i];
        let caseResult: CaseResult
        if (caseID in cases) {
            const previousCaseResult: CaseResult = cases[caseID];
            // current result is passed and previous result is failed. Expected is to fail
            if (passed && !previousCaseResult.passed) {
                caseResult = {
                    passed: false,
                    comment: `${previousCaseResult.comment}\n\n${comment}`
                }
            }

            else {
                caseResult = {
                    passed: passed,
                    comment: `${previousCaseResult.comment}\n\n${comment}`
                }
            }
        } else {
            caseResult = {
                passed: passed,
                comment: comment
            }
        }
        cases[caseID] = caseResult;
    }
    return cases
}

export default { getCaseIDsFromTags, getResultsPayload, getCaseResultsJson, getCaseIDsFromTitle }