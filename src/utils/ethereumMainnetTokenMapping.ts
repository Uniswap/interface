import { ZERO_ADDRESS } from 'constants/index'
import { isAddress } from 'utils'

export const getEthereumMainnetTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  } else if (address?.toLowerCase() === '0xd7DCd9B99787C619b4D57979521258D1A7267ad7'.toLowerCase()) {
    //EVRY
    uri = 'https://s2.coinmarketcap.com/static/img/coins/64x64/11458.png'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
      address
    )}/logo.png`
  }

  return uri
}
