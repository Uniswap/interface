import { RouteWithValidQuote } from '../../../entities'
import { CandidatePoolsBySelectionCriteria } from '../../../functions/get-candidate-pools'

export interface GetQuotesResult {
  routesWithValidQuotes: RouteWithValidQuote[]
  candidatePools?: CandidatePoolsBySelectionCriteria
}
