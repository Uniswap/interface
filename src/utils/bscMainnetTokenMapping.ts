export const getBscMainnetTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === '0xfe56d5892bdffc7bf58f2e84be1b2c32d21c308b') {
    //knc
    address = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  }
  if (!uri) {
    uri = `https://pancakeswap.finance/images/tokens/${address}.png`
  }

  return uri
}
