# cucumber-testrail-reporter

Pushes test results from cucumber framework into TestRail system.

## Installation

To successfully install the cucumber-testrail-reporter package from the repository [https://github.com/shawn-sam/cucumber-testrail-reporter](https://github.com/shawn-sam/cucumber-testrail-reporter), you must ensure that you have Git access to the repository.

Note:set up SSH/HTTPS Authentication on your machine before running the below installation command.

```shell
 npm install git+ssh://git@github.com:shawn-sam/cucumber-testrail-reporter.git
```

OR

```shell
 npm install git+https://github.com/shawn-sam/cucumber-testrail-reporter.git
```

<hr/>

## Options

**isTestRailRun**: *boolean* flag to indicate if the test run is to be updated to testrail

**jsonLocation**: *string* path where the JSON file will be located, and it will be updated with the results of the automation run. Upon completion of the run, the results will be transferred to the test run based on the data in the JSON file. By default it will be stored as ./testRail.json [OPTIONAL]

**getCaseIdFrom**: *string* Accepted Values - 'tags','title' . Default Value : "tags" [OPTIONAL]

**testRailConfig.domain**: *string* domain name of your TestRail instance (e.g. for a hosted instance instance.testrail.net)

**testRailConfig.username**: *string* user email under which the test run will be created

**testRailConfig.password**: *string* password or API token for user

**testRailConfig.projectId**: *number* project number with which the tests are associated

**testRailConfig.suiteId**: *number|array* suite number with which the tests are associated. Use an array to create a test plan & a number to create a test run [OPTIONAL]

**testRailConfig.includeAll**: *boolean* should all of the tests from the test suite be added to the run ? [OPTIONAL]

**testRailConfig.runName**: *string* Name that will be given to the run on TestRail [OPTIONAL]

**testRailConfig.runId**: *number* ID of the test run in which results need to be updated. If no runID is specified, the reporter will generate a new run for updating results, using the provided project ID and Suite ID.[OPTIONAL]

<hr/>

## Usage

Ensure that your TestRail installation API is enabled and generate your API keys. See <http://docs.gurock.com/>

### Add reporter to cucumber hooks

1. Create a testRailConfig file with the below details [optional]
   OR you can directly add it to the cucumber Hooks

```Javascript
//testRailConfig.ts
import TestRailReporter from "../../cucumber-testrail-reporter/cucumber-testrail-reporter"
export default new TestRailReporter({
  jsonLocation: "./testRail.json",
  isTestRailRun: true,
  testRailConfig: {
    domain: "https://abc.testrail.io/",
    username: "xyz@prq.com",
    password: "dummy_P@55w0rd",
    projectId: 0,
    suiteId: 0,
    // runName: "My test run",
    includeAll: true,
    // runId: 2,
  }
})
```

### Add below methods to the BeforeAll method in Cucumber hooks

**Setup Test Run**

The setupTestRun() method facilitates the setup of a test run, enabling the update of automation run results. If no run ID is specified, the plugin will generate a new test run using the suite ID or project ID. By default, all test cases within the suite will be copied to the newly created test run. If you prefer not to copy all test cases, you can set the `includeAll` parameter to false.

```Javascript
BeforeAll(async function () {
  await testRail.setupTestRun()
})
```

**Record Test Results**

The afterScenario(world, result) function analyzes the results of a scenario and records the case results in the Json file, which is specified in the `jsonLocation` parameter.

```Javascript
afterScenario: async function (world, result) {
  await TestRailReporter.afterScenario(world, result);
}
After(async function ( {pickle, result}:ITestCaseHookParameter) {
  await testRail.afterScenario(pickle, result);
});

```

**Publish Results to Test Run**

When the publish() method is invoked, it reads the testRail.json file specified in the jsonLocation parameter. It then proceeds to update the results into TestRail. It's important to note that the results will only be updated in TestRail if the `isTestRailRun` flag is set to true.

```Javascript
AfterAll(async function () {
  await testRail.publish()
})

```

### Mark your cucumber scenarios with ID of TestRail test cases

Ensure that your case ids are well distinct from test descriptions. You can specify the caseID as cucumber tags or in scenario title. By Default, caseIds are taken for tags

```gherkin
@C1234 @C3243
Scenario: C1234 C3243 I should be able to navigate to the home page
Scenario Outline: C1234 C3243 I should be able to navigate to the home page
```

Only passed or failed tests will be published. Skipped or pending tests will not be published resulting in a "Pending" status in TestRail test run.

Regarding Scenario Outlines, if any individual scenario within the outline fails, the overall status of the test case will be marked as "Failed".details about the failed & passed scenarios can be found within the case comments section

<hr/>

## Advanced Options

### Scenario A

**You want to update results to an existing automation run.**

Add to your config object:

```Javascript
runId: {runId} // ID of the test run to which you want to update the case results
```

Cannot be used with Scenario B or C.

<hr/>

### Scenario B

**You want to create a new test run and copy cases from suite.**

Add to your config object:

```Javascript
suiteId: {suiteId} // ID of the test suite from which test cases need to be copied, 
```

<hr/>

### Scenario C

**You want to create a new test run that does not include all tests in the suite, just the ones in your automation.**

Add to your config object:

```Javascript
includeAll: false
```

This would not include test cases from suite. Only Test cases in you automation run will be included.

<hr/>

### Scenario D

**You have different test cases with the same flow that you want to incorporate into one scenario outline**

Add to your config object:

```Javascript
getCaseIdFrom:"title"
```

In your feature file you can specify the caseId against each data input as given in the below example.

```gherkin
Scenario Outline: <caseId> I should be able to navigate to the <page> page
Given User should be on <page>
Examples:
| caseId | page |
| C1234  | login|
| C1234  | home |
```

## Feel free to submit any bugs/issues/suggestions

[https://github.com/shawn-sam/cucumber-testrail-reporter/issues](https://github.com/shawn-sam/cucumber-testrail-reporter/issues)

## References

- <http://docs.gurock.com/testrail-api2/start>
