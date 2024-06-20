import { MixedRoute, V2Route, V3Route } from '../../../../router'
import { CandidatePoolsBySelectionCriteria } from '../../../functions/get-candidate-pools'

export interface GetRoutesResult<Route extends V2Route | V3Route | MixedRoute> {
  routes: Route[]
  candidatePools: CandidatePoolsBySelectionCriteria
}
