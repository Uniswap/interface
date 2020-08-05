import moment from 'moment'
import React from 'react'
import { AccountSummary } from './AccountSummary'
import { AccountProposalVoteInfo } from './AccountProposalVoteInfo'

export class ProposalSummary {

  static statuses = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
    DEFEATED: 'DEFEATED',
    SUCCEEDED: 'SUCCEEDED',
    QUEUED: 'QUEUED',
    EXPIRED: 'EXPIRED',
    EXECUTED: 'EXECUTED'
  }

  static formatStatus(status) {
    return status.substring(0, 1) + status.substring(1).toLowerCase()
  }

  constructor({ proposal_id, title, description, start_block, end_block, start_timestamp, end_timestamp, proposal_status }) {
    this.proposalId = proposal_id
    this.title = title
    this.description = description
    this.startBlock = start_block
    this.endBlock = end_block
    this.startTimestamp = !!start_timestamp ? moment(start_timestamp) : null
    this.endTimestamp = !!end_timestamp ? moment(end_timestamp) : null
    this.proposalStatus = proposal_status
    this.account = null
  }

  withAccount(account) {
    if (account) {
      this.account = new AccountSummary(account)
    } else {
      this.account = null
    }
    return this
  }

  mostRecentDateText() {
    const momentFormatterDate = 'l'
    const momentFormatterTime = 'LT'
    if (!!this.endTimestamp) {
      if (moment(this.endTimestamp).isSame(moment(), 'day')) {
        return `Voting ended at ${moment(this.endTimestamp).format(momentFormatterTime)}`
      } else {
        return `Voting ended on ${moment(this.endTimestamp).format(momentFormatterDate)}`
      }
    } else if (!!this.startTimestamp) {
      if (moment(this.startTimestamp).isSame(moment(), 'day')) {
        return `Voting started at
         ${moment(this.startTimestamp).format(momentFormatterTime)}`
      } else {
        return `Voting started on ${moment(this.startTimestamp).format(momentFormatterDate)}`
      }
    } else {
      return ''
    }
  }

  proposalStatusFormatted() {
    return ProposalSummary.formatStatus(this.proposalStatus)
  }

  isVotingDisabled() {
    return !!this.account?.proposalVoteInfo?.voteStatus && this.account.proposalVoteInfo.voteStatus !== AccountProposalVoteInfo.statuses.VOTE
  }

}