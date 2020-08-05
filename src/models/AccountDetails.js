import { AccountSummary } from './AccountSummary'
import { AccountVoteHistory } from './AccountVoteHistory'
import { AccountVoteInfo } from './AccountVoteInfo'

export class AccountDetails extends AccountSummary {

  constructor(props) {
    super(props)
    this.voteInfo = !!props.vote_info ? new AccountVoteInfo(props.vote_info) : null
    this.voteHistory = !!props.vote_history ? props.vote_history.map(historyItem => new AccountVoteHistory(historyItem)) : null
  }

}