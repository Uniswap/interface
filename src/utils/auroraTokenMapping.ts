import { ZERO_ADDRESS } from 'constants/index'

export const getAuroraTokenLogoURL = (address: string) => {
  let uri

  if (
    address?.toLowerCase() === ZERO_ADDRESS ||
    address?.toLowerCase() === '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB'.toLowerCase()
  ) {
    //native token
    uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`
  }

  if (address?.toLowerCase() === '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802'.toLowerCase()) {
    //usdc
    uri = `https://raw.githubusercontent.com/aurora-is-near/bridge-assets/master/tokens/usdc.svg`
  }

  if (address?.toLowerCase() === '0x4988a896b1227218e4A686fdE5EabdcAbd91571f'.toLowerCase()) {
    //usdt
    uri = `https://raw.githubusercontent.com/aurora-is-near/bridge-assets/master/tokens/usdt.svg`
  }

  if (address?.toLowerCase() === '0xe3520349F477A5F6EB06107066048508498A291b'.toLowerCase()) {
    //dai
    uri = `https://raw.githubusercontent.com/aurora-is-near/bridge-assets/master/tokens/dai.svg`
  }

  if (!uri) {
    uri = ''
  }

  return uri
}
