const SafeEventEmitter = require('@metamask/safe-event-emitter').default

class BaseFilter extends SafeEventEmitter {

  constructor () {
    super()
    this.updates = []
  }

  async initialize () {}

  async update () {
    throw new Error('BaseFilter - no update method specified')
  }

  addResults (newResults) {
    this.updates = this.updates.concat(newResults)
    newResults.forEach(result => this.emit('update', result))
  }

  addInitialResults (newResults) {}

  getChangesAndClear () {
    const updates = this.updates
    this.updates = []
    return updates
  }
  
}

module.exports = BaseFilter
