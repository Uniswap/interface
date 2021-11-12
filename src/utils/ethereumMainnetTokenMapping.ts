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
  } else if (address?.toLowerCase() === '0x656C00e1BcD96f256F224AD9112FF426Ef053733'.toLowerCase()) {
    //EFI
    uri = 'https://s2.coinmarketcap.com/static/img/coins/64x64/8985.png'
  } else if (address?.toLowerCase() === '0x0C0F2b41F758d66bB8e694693B0f9e6FaE726499'.toLowerCase()) {
    // UND
    uri = 'https://s2.coinmarketcap.com/static/img/coins/64x64/7848.png'
  } else if (address?.toLowerCase() === '0x60ef10edff6d600cd91caeca04caed2a2e605fe5') {
    // MOCHI INU
    uri = 'https://s2.coinmarketcap.com/static/img/coins/64x64/14315.png'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
      address
    )}/logo.png`
  }

  return uri
}
