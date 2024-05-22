import { ChainSlug, isChainUrlParam } from 'constants/chains'
import { t } from 'i18n'
import { capitalize } from 'tsafe/capitalize'

export const getDefaultTokensTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const network: ChainSlug = parts?.find(isChainUrlParam) ?? 'ethereum'

  return t(`Explore top tokens on {{network}} on Uniswap`, {
    network: capitalize(network),
  })
}
