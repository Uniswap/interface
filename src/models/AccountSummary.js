import { AccountProposalVoteInfo } from './AccountProposalVoteInfo'

export class AccountSummary {

  constructor({ wallet_address, profile_picture_url, name, proposal_vote_info }) {
    this.walletAddress = wallet_address
    this.profilePictureUrl = profile_picture_url
    this.name = name
    this.proposalVoteInfo = !!proposal_vote_info ? new AccountProposalVoteInfo(proposal_vote_info) : null
  }

  withProposalVoteInfo(proposalVoteInfo) {
    if (proposalVoteInfo instanceof AccountProposalVoteInfo) {
      this.proposalVoteInfo = proposalVoteInfo
    } else {
      this.proposalVoteInfo = !!proposalVoteInfo ? new AccountProposalVoteInfo(proposalVoteInfo) : null
    }
  }

}