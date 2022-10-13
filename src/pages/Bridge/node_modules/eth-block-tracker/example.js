const createInfuraProvider = require('eth-json-rpc-infura/src/createProvider')
const PollingBlockTracker = require('./src/polling')


const provider = createInfuraProvider({ network: 'mainnet' })
const blockTracker = new PollingBlockTracker({ provider })

blockTracker.on('sync', ({ newBlock, oldBlock }) => {
  if (oldBlock) {
    console.log(`sync #${Number(oldBlock)} -> #${Number(newBlock)}`)
  } else {
    console.log(`first sync #${Number(newBlock)}`)
  }
})
