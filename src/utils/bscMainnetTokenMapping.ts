import { ZERO_ADDRESS } from 'constants/index'
import { isAddress } from 'utils'

export const getBscMainnetTokenLogoURL = (address: string) => {
  let uri

  // TODO: Refactor rewards logo get logo image from token list instead of mapping like this

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    address = `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`
  } else if (address?.toLowerCase() === '0xfe56d5892bdffc7bf58f2e84be1b2c32d21c308b') {
    //knc
    address = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  } else if (address?.toLowerCase() === '0x633237c6fa30fae46cc5bb22014da30e50a718cc') {
    //fiwa
    uri = `https://bscscan.com/token/images/defiwarrior_32b.png`
  } else if (address?.toLowerCase() === '0xd6cce248263ea1e2b8cb765178c944fc16ed0727') {
    //CTR
    uri = `https://bscscan.com/token/images/creator_32.png`
  } else if (address?.toLowerCase() === '0x339c72829ab7dd45c3c52f965e7abe358dd8761e') {
    //WANA
    uri = `https://assets.trustwalletapp.com/blockchains/smartchain/assets/${address}/logo.png`
  } else if (address?.toLowerCase() === '0x3944ac66b9b9b40a6474022d6962b6caa001b5e3') {
    // EBA
    uri = 'https://i.imgur.com/Tzs373u.png'
  } else if (address?.toLowerCase() === '0xE81257d932280AE440B17AFc5f07C8A110D21432') {
    // ZUKI
    uri = 'https://zukimoba.com/images/logos/logo.png'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${isAddress(
      address
    )}/logo.png`
    // uri = `https://pancakeswap.finance/images/tokens/${address}.png`
  }

  return uri
}
