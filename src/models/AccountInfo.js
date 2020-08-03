import { AccountVoteInfo } from './AccountVoteInfo'

export class AccountInfo {

  constructor({ wallet_address, profile_picture_url, name, vote_info }) {
    this.walletAddress = wallet_address
    this.profilePictureUrl = profile_picture_url
    this.name = name
    this.voteInfo = !!vote_info ? new AccountVoteInfo(vote_info) : null
  }

  setVoteInfo(voteInfo) {
    if (voteInfo instanceof AccountVoteInfo) {
      this.voteInfo = voteInfo
    } else {
      this.voteInfo = !!voteInfo ? new AccountVoteInfo(voteInfo) : null
    }
  }

}