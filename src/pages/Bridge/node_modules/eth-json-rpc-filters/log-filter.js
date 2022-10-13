const EthQuery = require('eth-query')
const pify = require('pify')
const BaseFilterWithHistory = require('./base-filter-history')
const { bnToHex, hexToInt, incrementHexInt, minBlockRef, blockRefIsNumber } = require('./hexUtils')

class LogFilter extends BaseFilterWithHistory {

  constructor ({ provider, params }) {
    super()
    this.type = 'log'
    this.ethQuery = new EthQuery(provider)
    this.params = Object.assign({
      fromBlock: 'latest',
      toBlock: 'latest',
      address: undefined,
      topics: [],
    }, params)
    // normalize address parameter
    if (this.params.address) {
      // ensure array
      if (!Array.isArray(this.params.address)) {
        this.params.address = [this.params.address]
      }
      // ensure lowercase
      this.params.address = this.params.address.map(address => address.toLowerCase())
    }
  }

  async initialize({ currentBlock }) {
    // resolve params.fromBlock
    let fromBlock = this.params.fromBlock
    if (['latest', 'pending'].includes(fromBlock)) fromBlock = currentBlock
    if ('earliest' === fromBlock) fromBlock = '0x0'
    this.params.fromBlock = fromBlock
    // set toBlock for initial lookup
    const toBlock = minBlockRef(this.params.toBlock, currentBlock)
    const params = Object.assign({}, this.params, { toBlock })
    // fetch logs and add to results
    const newLogs = await this._fetchLogs(params)
    this.addInitialResults(newLogs)
  }

  async update ({ oldBlock, newBlock }) {
    // configure params for this update
    const toBlock = newBlock
    let fromBlock
    // oldBlock is empty on first sync
    if (oldBlock) {
      fromBlock = incrementHexInt(oldBlock)
    } else {
      fromBlock = newBlock
    }
    // fetch logs
    const params = Object.assign({}, this.params, { fromBlock, toBlock })
    const newLogs = await this._fetchLogs(params)
    const matchingLogs = newLogs.filter(log => this.matchLog(log))

    // add to results
    this.addResults(matchingLogs)
  }

  async _fetchLogs (params) {
    const newLogs = await pify(cb => this.ethQuery.getLogs(params, cb))()
    // add to results
    return newLogs
  }

  matchLog(log) {
    // check if block number in bounds:
    if (hexToInt(this.params.fromBlock) >= hexToInt(log.blockNumber)) return false
    if (blockRefIsNumber(this.params.toBlock) && hexToInt(this.params.toBlock) <= hexToInt(log.blockNumber)) return false

    // address is correct:
    const normalizedLogAddress = log.address && log.address.toLowerCase()
    if (this.params.address && normalizedLogAddress && !this.params.address.includes(normalizedLogAddress)) return false

    // topics match:
    // topics are position-dependant
    // topics can be nested to represent `or` [[a || b], c]
    // topics can be null, representing a wild card for that position
    const topicsMatch = this.params.topics.every((topicPattern, index) => {
      // pattern is longer than actual topics
      let logTopic = log.topics[index]
      if (!logTopic) return false
      logTopic = logTopic.toLowerCase()
      // normalize subTopics
      let subtopicsToMatch = Array.isArray(topicPattern) ? topicPattern : [topicPattern]
      // check for wild card
      const subtopicsIncludeWildcard = subtopicsToMatch.includes(null)
      if (subtopicsIncludeWildcard) return true
      subtopicsToMatch = subtopicsToMatch.map(topic => topic.toLowerCase())
      // check each possible matching topic
      const topicDoesMatch = subtopicsToMatch.includes(logTopic)
      return topicDoesMatch
    })

    return topicsMatch
  }

}

module.exports = LogFilter
