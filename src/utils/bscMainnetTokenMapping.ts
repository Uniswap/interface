import { ZERO_ADDRESS } from 'constants/index'

export const getBscMainnetTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    uri = `https://raw.githubusercontent.com/dynamic-amm/dmm-interface/main/src/assets/networks/bsc-network.png`
  } else if (address?.toLowerCase() === '0xfe56d5892bdffc7bf58f2e84be1b2c32d21c308b') {
    //knc
    address = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  } else if (address?.toLowerCase() === '0x633237c6fa30fae46cc5bb22014da30e50a718cc') {
    //fiwa
    uri = `https://bscscan.com/token/images/defiwarrior_32b.png`
  } else if (address?.toLowerCase() === '0xd6cce248263ea1e2b8cb765178c944fc16ed0727') {
    //CTR
    uri = `https://assets.coingecko.com/coins/images/18252/small/logo_%281%29.png`
  }

  if (!uri) {
    uri = `https://pancakeswap.finance/images/tokens/${address}.png`
  }

  return uri
}
