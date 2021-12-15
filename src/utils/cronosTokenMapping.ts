import { ZERO_ADDRESS } from 'constants/index'
import { isAddress } from 'utils'

export const getCronosTokenLogoURL = (address: string) => {
  let uri

  if (address?.toLowerCase() === ZERO_ADDRESS) {
    //native token
    uri = `https://vvs.finance/images/tokens/0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23.svg`
  }

  if (!uri) {
    uri = `https://vvs.finance/images/tokens/${isAddress(address)}.svg`
  }

  return uri
}
