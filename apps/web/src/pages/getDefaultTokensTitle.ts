import { getValidUrlChainName } from 'graphql/data/util'
import { t } from 'i18n'
import { capitalize } from 'tsafe/capitalize'

export const getDefaultTokensTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const network = parts?.find((part) => getValidUrlChainName(part)) ?? 'ethereum'

  return t(`Explore top tokens on {{network}} on Uniswap`, {
    network: capitalize(network),
  })
}
