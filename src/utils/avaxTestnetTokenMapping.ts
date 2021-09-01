export const getAvaxTestnetTokenLogoURL = (address: string) => {
  let uri
  if (address?.toLowerCase() === '0xd00ae08403b9bbb9124bb305c09058e32c39a48c') {
    //native
    address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
    uri = `https://app.pangolin.exchange/static/media/avalanche_token_round.3e178e42.png`
  }

  if (address?.toLowerCase() === '0x5973774202e8b0ad563a69d502bb0e670e7d00dd') {
    //usdc
    address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  }
  if (address?.toLowerCase() === '0xbd1eeaf651aeb210106e1c1afb3bc41c388ee577') {
    //usdt
    address = '0xde3A24028580884448a5397872046a019649b084'
  }
  if (address?.toLowerCase() === '0xe50c0f38a1890db49d64ac1c4a5b4fe2f02f819d') {
    //dai
    address = '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/${address}/logo.png`
  }

  return uri
}
