import { default as React } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import EtherscanLogo from 'src/assets/logos/etherscan-logo.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Arrow } from 'src/components/icons/Arrow'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { addToSearchHistory, EtherscanSearchResult } from 'src/features/explore/searchHistorySlice'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'

type SearchEtherscanItemProps = {
  etherscanResult: EtherscanSearchResult
}

export function SearchEtherscanItem({ etherscanResult }: SearchEtherscanItemProps) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const navigation = useExploreStackNavigation()

  const { address } = etherscanResult

  const onPressViewEtherscan = () => {
    const explorerLink = getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS)
    navigation.navigate(Screens.WebView, {
      headerTitle: shortenAddress(address),
      uriLink: explorerLink,
    })
    dispatch(
      addToSearchHistory({
        searchResult: etherscanResult,
      })
    )
  }

  return (
    <TouchableArea name={ElementName.SearchEtherscanItem} onPress={onPressViewEtherscan}>
      <Flex row alignItems="center" gap="sm" justifyContent="space-between" px="xs" py="sm">
        <Flex centered row gap="sm">
          <EtherscanLogo height={theme.iconSizes.xxxl} width={theme.iconSizes.xxxl} />
          <Text variant="buttonLabelMedium">{shortenAddress(address)}</Text>
        </Flex>
        <Arrow color={theme.colors.textSecondary} direction="ne" size={24} />
      </Flex>
    </TouchableArea>
  )
}
