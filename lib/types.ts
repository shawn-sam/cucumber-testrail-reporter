export type CaseResult = {
  passed: boolean;
  comment?: string;
}
export type Cases = {
  [key: number | string]: CaseResult;
}

export type TestRailConfig = {
  domain: string;
  username: string;
  password: string;
  projectId: number;
  suiteId?: number;
  runName?: string;
  runId?: number;
  includeAll?: boolean;
}

export type TestRailOptions = {
  isTestRailRun: boolean;
  jsonLocation?: string;
  testRailConfig: TestRailConfig;
  getCaseIdFrom?: getCaseIdFrom;
}

export type TestResult = {
  case_id: number,
  status_id: number,
  comment?: string,
}

export type Results = {
  results: TestResult[]
}
export type getCaseIdFrom = 'tags' | 'title'