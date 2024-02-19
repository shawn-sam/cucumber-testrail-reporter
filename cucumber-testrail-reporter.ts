import testRail from "./lib/testrail";
import { Pickle, Result, Cases, TestRailConfig, TestRailOptions, getCaseIdFrom } from "./lib/types";
import { getCasesFromTestRailJson, writeCasesToTestRailJson } from "./lib/json-handler"
// import { Pickle, TestStepResult } from "@cucumber/messages";
import testRailApis from "./lib/testRail-apis"


/**
* This is a custom reporter for playwright-cucumber framework which will update the test results to testrail.
*  @constructor
     * @param {string} options.jsonLocation - location of json file to store test results. By default it will be stored as ./testRail.json
     * @param {boolean} options.isTestRailRun - flag to indicate if the test run is to be updated to testrail
     * @param {testRailConfig} options.testRailConfig - testRailConfig object containing testrail credentials and project details
     * @param {string} options.testRailConfig.domain - testrail domain
     * @param {string} options.testRailConfig.username - testrail username
     * @param {string} options.testRailConfig.password - testrail password
     * @param {number} options.testRailConfig.projectId - testrail project id
     * @param {number} options.testRailConfig.suiteId - testrail suite id. Default Value : 0 [OPTIONAL]
     * @param {string} options.testRailConfig.runName - testrail run name, Default Value : "" [OPTIONAL]
     * @param {number} options.testRailConfig.runId - testrail run id. Default Value : 0 [OPTIONAL]
     * @param {Boolean} options.testRailConfig.includeAll - includeAll test cases in suite to Test Run. Default Value : true [OPTIONAL]
     * @param {getCaseIdFrom} options.getCaseIdFrom - getCaseIdFrom. Default Value : "tags" [OPTIONAL]
**/
class CucumberTestRailReporter {
    jsonLocation: string;
    isTestRailRun: boolean;
    getCaseIdFrom: getCaseIdFrom
    testRailApi: testRailApis
    addTestCases: boolean

    constructor(options: TestRailOptions) {
        this._validate(options, "isTestRailRun");
        if (options.getCaseIdFrom)
            this._validate(options, "getCaseIdFrom");
        // Initialize any necessary variables or state
        const { jsonLocation, getCaseIdFrom, isTestRailRun, testRailConfig } = options
        this.jsonLocation = jsonLocation ? jsonLocation : "./testRail.json"
        this.getCaseIdFrom = getCaseIdFrom ? getCaseIdFrom : "tags"
        this.isTestRailRun = isTestRailRun
        this.testRailApi = new testRailApis(testRailConfig)

        const { runId, includeAll } = testRailConfig
        // If runId and suiteId are not provided, then add test cases to  test run
        this.addTestCases = runId === undefined && includeAll === false
    }
    setupTestRun = async () => {
        if (this.isTestRailRun) {
            await this.testRailApi.setupTestRun()
            writeCasesToTestRailJson(this.jsonLocation, {})
        }
    }
    afterScenario = async (pickle: Pickle , result: Result | undefined) => {
        const tags = pickle.tags.map((tag) => { return tag.name })
        const scenarioName = pickle.name

        // Case ID can be fetched from title or tags.By Default it will be fetched from tags
        const caseIDs: number[] = (this.getCaseIdFrom === "title") ? await testRail.getCaseIDsFromTitle(scenarioName) : await testRail.getCaseIDsFromTags(tags)
        let casesJson: Cases = getCasesFromTestRailJson(this.jsonLocation)
        const comment = `Scenario : ${scenarioName}.\n Test case has ${result?.status}. Validated by Automation User.`
        casesJson = await testRail.getCaseResultsJson(casesJson, caseIDs, result?.status == "PASSED", comment)
        writeCasesToTestRailJson(this.jsonLocation, casesJson)
    };
    publish = async () => {
        if (this.isTestRailRun) {
            const cases: Cases = getCasesFromTestRailJson(this.jsonLocation)
            if (this.addTestCases) {
                await this.testRailApi.addTestCasesToRun(Object.keys(cases))
            }
            await this.testRailApi.updateCaseResultsIndividuallyToRun(cases)
        }
        else {
            console.log("Results will not be updated to testrail as isTestRailRun flag is set to false")
        }
    }
    _validate(options: { [x: string]: unknown; isTestRailRun?: boolean; jsonLocation?: string | undefined; testRailConfig?: TestRailConfig; getCaseIdFrom?: getCaseIdFrom | undefined; } | null, name: string) {
        if (options == null) {
            throw new Error("Missing testRailsOptions in testrail.config");
        }
        if (options[name] == null) {
            throw new Error(`Missing '${name}' field value. Please update testRailsOptions in testrail.config`);
        }
        if (name === "getCaseIdFrom" && options[name] !== "tags" && options[name] !== "title") {
            throw new Error(`Invalid value for getCaseIdFrom : '${options[name]}'. Accepted Values are "tags" or "title".Please update testRailsOptions in testrail.config`);
        }
    }
}

export default CucumberTestRailReporter;