
module.exports = {
  minBlockRef,
  maxBlockRef,
  sortBlockRefs,
  bnToHex,
  blockRefIsNumber,
  hexToInt,
  incrementHexInt,
  intToHex,
  unsafeRandomBytes,
}

function minBlockRef(...refs) {
  const sortedRefs = sortBlockRefs(refs)
  return sortedRefs[0]
}

function maxBlockRef(...refs) {
  const sortedRefs = sortBlockRefs(refs)
  return sortedRefs[sortedRefs.length-1]
}

function sortBlockRefs(refs) {
  return refs.sort((refA, refB) => {
    if (refA === 'latest' || refB === 'earliest') return 1
    if (refB === 'latest' || refA === 'earliest') return -1
    return hexToInt(refA) - hexToInt(refB)
  })
}

function bnToHex(bn) {
  return '0x' + bn.toString(16)
}

function blockRefIsNumber(blockRef){
  return blockRef && !['earliest', 'latest', 'pending'].includes(blockRef)
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
  let hexString = int.toString(16)
  const needsLeftPad = hexString.length % 2
  if (needsLeftPad) hexString = '0' + hexString
  return '0x' + hexString
}

function unsafeRandomBytes(byteCount) {
  let result = '0x'
  for (let i = 0; i < byteCount; i++) {
    result += unsafeRandomNibble()
    result += unsafeRandomNibble()
  }
  return result
}

function unsafeRandomNibble() {
  return Math.floor(Math.random() * 16).toString(16)
}
