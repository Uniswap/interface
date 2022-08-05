const MapAddress: { [key: string]: string } = {
  '0x9c3c9283d3e44854697cd22d3faa240cfb032889': '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
  '0xfd1f9381cb641dc76fe8087dbcf8ea84a2c77cbe': '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202',
  '0x19395624c030a11f58e820c3aefb1f5960d9742a': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0x2cec76b26a8d96bf3072d34a01bb3a4ede7c06be': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0x064b91bda6d178dfe03835de9450bfe78201c43f': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  '0x5e2de02472ac02736b43054f095837725a5870ef': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  '0x326c977e6efc84e512bb9c30f76e30c160ed06fb': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
}
export const getMumbaiTokenLogoURL = (address: string) => {
  let uri

  if (address) address = MapAddress[address.toLowerCase()] || address

  if (!uri) {
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
  }

  return uri
}
