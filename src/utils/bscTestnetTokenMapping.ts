export const getBscTestnetTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === '0xae13d989dac2f0debff460ac112a837c89baa7cd') {
    //native
    address = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
    uri = `https://pancakeswap.finance/images/tokens/${address}.png`
  }
  if (address?.toLowerCase() === '0xfd1f9381cb641dc76fe8087dbcf8ea84a2c77cbe') {
    //knc
    address = '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202'
  }
  if (address?.toLowerCase() === '0x19395624c030a11f58e820c3aefb1f5960d9742a') {
    //eth
    address = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'
    uri = `https://pancakeswap.finance/images/tokens/${address}.png`
  }
  if (address?.toLowerCase() === '0xb448b701807e644f141a4e4a269ad2f567526505') {
    //usdc
    address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  }
  if (address?.toLowerCase() === '0x3d8f2ada8e97e4ef19e4ccbf6ec1ca52900406aa') {
    //usdt
    address = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  }
  if (address?.toLowerCase() === '0xbb843a2296f9aa49070eb2dcd482f23548238f65') {
    //dai
    address = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  }

  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  }

  return uri
}
