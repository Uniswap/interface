import { default as React } from 'react'
import { useDispatch } from 'react-redux'
import { SEARCH_ITEM_ICON_SIZE, SEARCH_ITEM_PX, SEARCH_ITEM_PY } from 'src/components/explore/search/constants'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EtherscanSearchResult } from 'uniswap/src/features/search/SearchResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

type SearchEtherscanItemProps = {
  etherscanResult: EtherscanSearchResult
}

export function SearchEtherscanItem({ etherscanResult }: SearchEtherscanItemProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()

  const { address } = etherscanResult

  const onPressViewEtherscan = async (): Promise<void> => {
    const explorerLink = getExplorerLink(defaultChainId, address, ExplorerDataType.ADDRESS)
    await openUri(explorerLink)
    dispatch(
      addToSearchHistory({
        searchResult: etherscanResult,
      }),
    )
  }

  const EtherscanIcon = getBlockExplorerIcon(defaultChainId)

  return (
    <TouchableArea testID={TestID.SearchEtherscanItem} onPress={onPressViewEtherscan}>
      <Flex
        row
        alignItems="center"
        gap="$spacing12"
        justifyContent="space-between"
        px={SEARCH_ITEM_PX}
        py={SEARCH_ITEM_PY}
      >
        <Flex centered row gap="$spacing12">
          <EtherscanIcon size={SEARCH_ITEM_ICON_SIZE} />
          <Text variant="body1">{shortenAddress(address)}</Text>
        </Flex>
        <Arrow color={colors.neutral2.val} direction="ne" size={iconSizes.icon24} />
      </Flex>
    </TouchableArea>
  )
}
