const BaseFilter = require('./base-filter')

// tracks all results ever recorded
class BaseFilterWithHistory extends BaseFilter {

  constructor () {
    super()
    this.allResults = []
  }

  async update () {
    throw new Error('BaseFilterWithHistory - no update method specified')
  }

  addResults (newResults) {
    this.allResults = this.allResults.concat(newResults)
    super.addResults(newResults)
  }

  addInitialResults (newResults) {
    this.allResults = this.allResults.concat(newResults)
    super.addInitialResults(newResults)
  }

  getAllResults () {
    return this.allResults
  }

}

module.exports = BaseFilterWithHistory