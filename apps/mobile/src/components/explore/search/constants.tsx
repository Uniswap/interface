import { SearchHeader, SearchHeaderKey } from 'src/components/explore/search/types'
import { Coin, Gallery, Person } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import i18n from 'uniswap/src/i18n'

export const SEARCH_RESULT_HEADER_KEY: SearchHeaderKey = 'header'

export const SEARCH_ITEM_PX = '$spacing20'
export const SEARCH_ITEM_PY = '$spacing8'
export const SEARCH_ITEM_ICON_SIZE = iconSizes.icon36

const ICON_SIZE = '$icon.24'
const ICON_COLOR = '$neutral2'

export const WalletHeaderItem: SearchHeader = {
  icon: <Person color={ICON_COLOR} size={ICON_SIZE} />,
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.wallets'),
}
export const TokenHeaderItem: SearchHeader = {
  icon: <Coin color={ICON_COLOR} size={ICON_SIZE} />,
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.tokens'),
}
export const NFTHeaderItem: SearchHeader = {
  icon: <Gallery color={ICON_COLOR} size={ICON_SIZE} />,
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.nft'),
}
export const EtherscanHeaderItem: (chainId: UniverseChainId) => SearchHeader = (chainId: UniverseChainId) => ({
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.action.viewEtherscan', {
    blockExplorerName: getChainInfo(chainId).explorer.name,
  }),
})
