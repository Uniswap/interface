import { SearchHeader, SearchHeaderKey } from 'src/components/explore/search/types'
import { Coin, Gallery, Person } from 'ui/src/components/icons'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import i18n from 'uniswap/src/i18n/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const SEARCH_RESULT_HEADER_KEY: SearchHeaderKey = 'header'

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
    blockExplorerName: UNIVERSE_CHAIN_INFO[chainId].explorer.name,
  }),
})
