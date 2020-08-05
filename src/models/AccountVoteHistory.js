import { ProposalSummary } from './ProposalSummary'
import BN from 'bn.js'

export class AccountVoteHistory extends ProposalSummary {

  constructor(props) {
    super(props)
    this.accountVoteStatus = props.account_vote_status
    this.votesCastedBN = new BN(props.votes_casted_padded)
  }

}