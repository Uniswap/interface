import ethers from 'ethers';

export class AccountVoteInfo {

  constructor({ votes_padded, delegate_address }) {
    this.votesBN = ethers.BigNumber.from(votes_padded)
    this.delegateAddress = delegate_address
  }

  isDelegating() {
    return !!this.delegateAddress
  }

}