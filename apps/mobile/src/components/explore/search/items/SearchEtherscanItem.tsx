import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { Arrow } from 'src/components/icons/Arrow'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { addToSearchHistory } from 'src/features/explore/searchHistorySlice'
import { EtherscanSearchResult } from 'src/features/explore/SearchResult'
import { ElementName } from 'src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ChainId } from 'wallet/src/constants/chains'
import { shortenAddress } from 'wallet/src/utils/addresses'

type SearchEtherscanItemProps = {
  etherscanResult: EtherscanSearchResult
}

export function SearchEtherscanItem({ etherscanResult }: SearchEtherscanItemProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const { address } = etherscanResult

  const onPressViewEtherscan = async (): Promise<void> => {
    const explorerLink = getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS)
    await openUri(explorerLink)
    dispatch(
      addToSearchHistory({
        searchResult: etherscanResult,
      })
    )
  }

  const EtherscanIcon = getBlockExplorerIcon(ChainId.Mainnet)

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={ElementName.SearchEtherscanItem}
      onPress={onPressViewEtherscan}>
      <Flex
        row
        alignItems="center"
        gap="$spacing12"
        justifyContent="space-between"
        px="$spacing8"
        py="$spacing12">
        <Flex centered row gap="$spacing12">
          <EtherscanIcon size="$icon.40" />
          <Text variant="body1">{shortenAddress(address)}</Text>
        </Flex>
        <Arrow color={colors.neutral2.val} direction="ne" size={iconSizes.icon24} />
      </Flex>
    </TouchableArea>
  )
}
