import { ZERO_ADDRESS } from 'constants/index'

export const getAvaxMainnetTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    uri = `https://raw.githubusercontent.com/dynamic-amm/dmm-interface/main/src/assets/networks/avax-network.png`
  } else if (address?.toLowerCase() === '0xc7198437980c041c805a1edcba50c1ce5db95118') {
    //usdt
    address = '0xde3A24028580884448a5397872046a019649b084'
  } else if (address?.toLowerCase() === '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664') {
    //usdc
    address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  } else if (address?.toLowerCase() === '0xd586e7f844cea2f87f50152665bcbc2c279d8d70') {
    //dai
    address = '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a'
  } else if (address?.toLowerCase() === '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab') {
    //weth.e
    address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  } else if (address?.toLowerCase() === '0x938fe3788222a74924e062120e7bfac829c719fb') {
    uri = 'https://i.imgur.com/jXxS6uW.png'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/${address}/logo.png`
  }

  return uri
}
