import { utils } from 'ethers'

export const generateBytesByType = (type: string, value: string) => {
  switch (type) {
    case 'address':
      return utils.hexZeroPad(value, 32).substring(2)
    case 'uint256':
      const valueDecimals = utils.parseUnits(Number(value).toFixed(18), 18)
      const valueHex = valueDecimals.toHexString()
      return utils.hexZeroPad(valueHex, 32).substring(2)
  }

  return ''
}
