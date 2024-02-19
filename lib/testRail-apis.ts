/* eslint-disable @typescript-eslint/no-explicit-any */
import { CaseResult, Cases, Results, TestRailConfig } from "./types";
import axios, { AxiosInstance } from "axios";
import moment from "moment";

export default class testRailApis {
	domain: string;
	projectId: number;
	suiteId: number;
	runName: string;
	runId: number;
	authHeader: { Authorization: string };
	axiosInstance: AxiosInstance
	includeAll: boolean
	/**
		 * @param {Object} options - wdio TestRail specific configurations
		 * @param {string} options.domain - Domain for TestRail
		 * @param {number} options.projectId - Project identifier
		 * @param {Array.<number>} options.suiteId - Suite identifier
		 * @param {string} options.username - User email
		 * @param {string} options.password - User API key
		 * @param {Boolean} options.runName - Name to be used for the created test run
		 * @param {Boolean} options.includeAll - Flag to include all tests from a suite in a run
		 * @param {number} [options.runId] - Test run identifier for test run to update
	**/
	constructor(config: TestRailConfig) {
		this._validate(config, 'domain');
		this._validate(config, 'username');
		this._validate(config, 'password');
		this._validate(config, 'projectId');

		(this.domain = config.domain + "/index.php?"),
			(this.projectId = config.projectId),
			(this.suiteId = config.suiteId ? config.suiteId : 0),
			(this.runName = config.runName ? config.runName : ""),
			(this.runId = config.runId ? config.runId : 0);
		(this.includeAll = config.includeAll === false ? false : true)

		const base64_Value = Buffer.from(`${config.username}:${config.password}`).toString("base64");
		this.authHeader = { Authorization: `Basic ${base64_Value}` };
		this.axiosInstance = axios.create({
			baseURL: this.domain,
			headers: this.authHeader
		})
	}

	setupTestRun = async (): Promise<number> => {
		//runId : if a runId is provided as input parameter, it will update the test results to the existing test run.
		// else will create a new run and update the test results into the created run
		if (this.runId === 0) {
			const response = await this.createNewTestRun();
			this.runId = response.id;
		}
		return this.runId;
	};

	createNewTestRun = async () => {
		const endpoint = `/api/v2/add_run/${this.projectId}`;
		if (this.runName === "")
			this.runName = this.suiteId === 0 ? "Automation Run - " + moment().format("MMMM Do, YYYY h:mm a") : await this.createTestRunNameFromSuite();
		const payload = {
			name: `${this.runName}`,
			include_all: this.includeAll,
			...(this.suiteId !== 0 && { suite_id: `${this.suiteId}` }),
		};
		const response = await this.axiosInstance.post(endpoint, payload)
		return response.data

	}

	createTestRunNameFromSuite = async () => {
		const response = await this.getSuiteDetails(this.suiteId)
		const suiteName = response.name
		const runName = suiteName  + " | " + moment().format("MMMM Do, YYYY h:mm a")
		return runName
	}

	updateTestResultsToRun = async (payload: Results) => {
		const endpoint = `/api/v2/add_results_for_cases/${this.runId}`;
		try {
			const response = await this.axiosInstance.post(endpoint, payload)
			return response.data
		}
		catch (error) {
			console.error(error)
		}
	}

	/*statusId : The ID of the test status. The default system statuses have the following IDs:
	1: Passed
	2: Blocked
	3: Untested (not allowed when adding a new result)
	4: Retest
	5: Failed
	*/
	updateCaseResultsIndividuallyToRun = async (cases: Cases): Promise<void> => {
		// Will update the individual test case results to the existing test run.
		const caseIDs = Object.keys(cases)
		for (let i = 0; i < caseIDs.length; i++) {
			const caseID = caseIDs[i];
			const caseResult: CaseResult = cases[caseID];
			const payload = {
				status_id: caseResult.passed ? 1 : 5,
				comment: caseResult.comment,
				custom_executed: 9
			}
			try {
				await this.updateCaseResultToRun(caseID, payload)
			}
			catch (error: any) {
				console.error(`Unable to update the test result for caseID: ${caseID} with error: ${error.response.data.error}`)
				const errorMsg = error.response.data.error
				if (errorMsg.includes("case_id is not a valid test case"))
					console.error(`Case ID: C${caseID} is not present in Run:R${this.runId}!!`)
				else if (errorMsg.includes("The test run is already completed")) {
					console.error(`Run ID: ${this.runId} is a Closed Run!!`)
					return
				}
			}
		}
	};

	addTestCasesToRun = async (caseIds: string[]) => {
		const endpoint = `/api/v2/update_run/${this.runId}`;
		const payload = {
			include_all: false,
			case_ids: caseIds,
		};
		try {
			const response = await this.axiosInstance.post(endpoint, payload)
			return response.data
		}
		catch (error: any) {
			console.error(`Unable to add caseID: ${caseIds} to Test Run.with error: ${error.response.data.error}`)
		}
	}

	getSuiteDetails = async (suiteID: number) => {
		const endpoint = `/api/v2/get_suite/${suiteID}`;
		const response = await this.axiosInstance.get(endpoint)
		return response.data
	}

	updateCaseResultToRun = async (caseID: string, payload: { status_id: number, comment?: string }) => {
		const endpoint = `/api/v2/add_result_for_case/${this.runId}/${caseID}`
		const response = await this.axiosInstance.post(endpoint, payload)
		return response.data
	}

	/**
	 * Verifies if required options exist in webdriverio config file
	 *
	 * @param {Object} options - TestRail specifc configurations
	 * @param {string} options.domain - Domain for TestRail
	 * @param {number} options.projectId - Project identifier
	 * @param {Array.<number>} options.suiteId - List of suites identifiers
	 * @param {number} [options.assignedToId] - User identifier
	 * @param {string} options.username - User email
	 * @param {string} options.password - User API key
	 * @param {Boolean} options.includeAll - Flag to inlcude all tests from a suite in a run
	 * @param {number} [options.updateRun] - Test run identifier for test run to update
	 * @param {number} [options.updatePlan] - Test plan identifier for a test plan to update
	 * @param {string} name - Name of the property
	 * @private
	 */
	_validate(options: any, name: string) {
		if (options == null) {
			throw new Error("Missing testRailsOptions in wdio.conf");
		}
		if (options[name] == null) {
			throw new Error(`Missing ${name} value. Please update testRailsOptions in wdio.conf`);
		}
	}
}