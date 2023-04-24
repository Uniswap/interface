import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { EtherscanIcon } from 'src/components/icons/EtherscanIcon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { addToSearchHistory, EtherscanSearchResult } from 'src/features/explore/searchHistorySlice'
import { ElementName } from 'src/features/telemetry/constants'
import { shortenAddress } from 'src/utils/addresses'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'

type SearchEtherscanItemProps = {
  etherscanResult: EtherscanSearchResult
}

export function SearchEtherscanItem({ etherscanResult }: SearchEtherscanItemProps): JSX.Element {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const { address } = etherscanResult

  const onPressViewEtherscan = (): void => {
    const explorerLink = getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS)
    openUri(explorerLink)
    dispatch(
      addToSearchHistory({
        searchResult: etherscanResult,
      })
    )
  }

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      name={ElementName.SearchEtherscanItem}
      onPress={onPressViewEtherscan}>
      <Flex
        row
        alignItems="center"
        gap="spacing12"
        justifyContent="space-between"
        px="spacing8"
        py="spacing12">
        <Flex centered row gap="spacing12">
          <EtherscanIcon size={theme.iconSizes.icon40} />
          <Text variant="bodyLarge">{shortenAddress(address)}</Text>
        </Flex>
        <Arrow color={theme.colors.textSecondary} direction="ne" size={24} />
      </Flex>
    </TouchableArea>
  )
}
