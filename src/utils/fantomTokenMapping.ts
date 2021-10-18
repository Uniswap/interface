import { ZERO_ADDRESS } from 'constants/index'

export const getFantomTokenLogoURL = (address: string) => {
  let uri

  if (!uri) {
    uri = `https://raw.githubusercontent.com/sushiswap/logos/main/network/fantom/${address}.jpg`
  }

  return uri
}
