import moment from 'moment'
import { ProposalSummary } from './ProposalSummary'

export class ProposalHistoryBreadcrumb {

  constructor({ status, block_number, timestamp, transaction_hash }) {
    this.status = status
    this.blockNumber = block_number
    this.timestamp = moment(timestamp)
    this.transactionHash = transaction_hash
  }

  statusFormatted() {
    return ProposalSummary.formatStatus(this.status)
  }

  timestampFormatted() {
    const momentFormatterDateTime = 'l LT'
    const momentFormatterTime = 'LT'
    const timestamp = this.timestamp

    if (moment(timestamp).isSame(moment(), 'day')) {
      return `Today at ${moment(timestamp).format(momentFormatterTime)}`
    } else {
      return moment(timestamp).format(momentFormatterDateTime)
    }
  }

}