module.exports = getBlocksForRange

async function getBlocksForRange({ provider, fromBlock, toBlock }) {
  if (!fromBlock) fromBlock = toBlock

  const fromBlockNumber = hexToInt(fromBlock)
  const toBlockNumber = hexToInt(toBlock)
  const blockCountToQuery = toBlockNumber - fromBlockNumber + 1
  // load all blocks from old to new (inclusive)
  const missingBlockNumbers = Array(blockCountToQuery).fill()
                              .map((_,index) => fromBlockNumber + index)
                              .map(intToHex)
  const blockBodies = await Promise.all(
    missingBlockNumbers.map(blockNum => query(provider, 'eth_getBlockByNumber', [blockNum, false]))
  )
  return blockBodies
}

function hexToInt(hexString) {
  if (hexString === undefined || hexString === null) return hexString
  return Number.parseInt(hexString, 16)
}

function incrementHexInt(hexString){
  if (hexString === undefined || hexString === null) return hexString
  const value = hexToInt(hexString)
  return intToHex(value + 1)
}

function intToHex(int) {
  if (int === undefined || int === null) return int
  const hexString = int.toString(16)
  return '0x' + hexString
}

function query(provider, method, params) {
  return new Promise((resolve, reject) => {
    provider.sendAsync({ id: 1, jsonrpc: '2.0', method, params }, (err, res) => {
      if (err) return reject(err)
      resolve(res.result)
    })
  })
}
