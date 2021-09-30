import { ZERO_ADDRESS } from 'constants/index'
import { isAddress } from 'utils'

export const getEthereumMainnetTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
      address
    )}/logo.png`
  }

  return uri
}
