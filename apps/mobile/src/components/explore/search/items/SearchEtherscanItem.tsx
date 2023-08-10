import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { EtherscanIcon } from 'src/components/icons/EtherscanIcon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { addToSearchHistory, EtherscanSearchResult } from 'src/features/explore/searchHistorySlice'
import { ElementName } from 'src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'
import { ChainId } from 'wallet/src/constants/chains'
import { shortenAddress } from 'wallet/src/utils/addresses'

type SearchEtherscanItemProps = {
  etherscanResult: EtherscanSearchResult
}

export function SearchEtherscanItem({ etherscanResult }: SearchEtherscanItemProps): JSX.Element {
  const theme = useAppTheme()
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

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={ElementName.SearchEtherscanItem}
      onPress={onPressViewEtherscan}>
      <Flex
        row
        alignItems="center"
        gap="spacing12"
        justifyContent="space-between"
        px="spacing8"
        py="spacing12">
        <Flex centered row gap="spacing12">
          <EtherscanIcon height={theme.iconSizes.icon40} width={theme.iconSizes.icon40} />
          <Text variant="bodyLarge">{shortenAddress(address)}</Text>
        </Flex>
        <Arrow color={theme.colors.neutral2} direction="ne" size={24} />
      </Flex>
    </TouchableArea>
  )
}
