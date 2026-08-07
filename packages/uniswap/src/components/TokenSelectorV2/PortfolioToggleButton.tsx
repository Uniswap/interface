import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TOKEN_SELECTOR_V2_CONTROL_HEIGHT } from 'uniswap/src/components/TokenSelectorV2/constants'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

/**
 * Collapsed-sidebar toggle: avatar + compact total portfolio value, rendered inline as a
 * sibling of the search input at the same 48px height (Figma 750:13915 "side", 107×48).
 */
export function PortfolioToggleButton({
  addresses,
  onPress,
}: {
  addresses: AddressGroup
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { data: totalValue } = usePortfolioTotalValue({
    evmAddress: addresses.evmAddress,
    svmAddress: addresses.svmAddress,
  })

  return (
    <TouchableArea
      accessibilityLabel={t('tokens.selectorV2.myTokens.expand')}
      accessibilityRole="button"
      testID={TestID.TokenSelectorV2SidebarToggle}
      onPress={onPress}
    >
      <Flex
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth={1}
        gap="$spacing6"
        height={TOKEN_SELECTOR_V2_CONTROL_HEIGHT}
        px="$spacing12"
      >
        <AccountIcon address={addresses.evmAddress ?? addresses.svmAddress} size={iconSizes.icon24} />
        <Text color="$neutral1" variant="buttonLabel3">
          {convertFiatAmountFormatted(totalValue?.balanceUSD, NumberType.FiatTokenStats)}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
