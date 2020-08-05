import { ethers } from 'ethers'

export class AccountProposalVoteInfo {

  static statuses = {
    FOR: 'FOR',
    AGAINST: 'AGAINST',
    NO_VOTE: 'NO_VOTE',
    VOTE: 'VOTE'
  }

  static toFormattedVoteString(voteStatus) {
    const split = voteStatus.split('_')
    const value = split[0].substring(0, 1) + split[0].substring(1).toLowerCase();
    if (split.length >= 2) {
      return value + ' ' + split[1].substring(0, 1) + split[1].substring(1).toLowerCase()
    } else {
      return value
    }
  }

  static toFormattedVoteButtonString(voteStatus) {
    return AccountProposalVoteInfo.toFormattedVoteString(voteStatus).toUpperCase()
  }

  constructor({ vote_status, votes_casted_padded }) {
    this.voteStatus = vote_status
    this.votesCastedBN = ethers.BigNumber.from(votes_casted_padded)
  }

  formattedVoteString() {
    return AccountProposalVoteInfo.toFormattedVoteString(this.voteStatus)
  }

}