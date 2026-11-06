// Engine barrel. Pure TS, no framework imports.
export * from "./types.js";
export {
  decodeVin,
  fetchComplaints,
  fetchComplaintsForYears,
  fetchRecalls,
  fetchRecallsForYears,
  normalizeComplaint,
  normalizeRecall,
  getJson,
  type FetchOpts,
} from "./nhtsa.js";
export {
  loadInvestigations,
  investigationsFor,
  parseInvestigationLines,
  investigationOutcome,
  fetchInvestigationDocs,
  withInvestigationUrls,
  FLAT_INV_URL,
  type LoadInvestigationsOpts,
  type InvestigationDoc,
} from "./investigations.js";
export { classify, explainMatch, matchesMode, compilePattern } from "./classify.js";
export { coverageFor, matchedTerms, investigationStatus, strongest, weakest, STATUS_ORDER } from "./coverage.js";
export { computeSignal, ruleText, DEFAULT_RULE, NO_PEER_MIN_SHARE } from "./signal.js";
export { scan } from "./scan.js";
export { parseUsDate, parseRecallDate, parseYmd, monthOf, monthRange, monthlySeries } from "./dates.js";
export { cachedJson } from "./cache.js";
