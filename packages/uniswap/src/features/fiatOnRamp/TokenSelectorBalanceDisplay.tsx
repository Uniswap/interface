import { ComponentProps } from 'react'
import { Flex, SpinningLoader, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, spacing } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useFormatExactCurrencyAmount } from 'uniswap/src/features/fiatOnRamp/hooks'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

interface TokenSelectorBalanceDisplayProps {
  onPress: () => void
  selectedCurrencyInfo: CurrencyInfo
  disabled?: boolean
  loading?: boolean
  chevronDirection?: ComponentProps<typeof RotatableChevron>['direction']
  testID?: TestIDType
  portfolioBalance?: PortfolioBalance | null | undefined
}

export function TokenSelectorBalanceDisplay({
  selectedCurrencyInfo,
  onPress,
  disabled,
  loading,
  chevronDirection = 'end',
  testID,
  portfolioBalance,
}: TokenSelectorBalanceDisplayProps): JSX.Element {
  const balanceQuantity = portfolioBalance?.quantity.toString() || '0'
  const formattedAmount = useFormatExactCurrencyAmount(balanceQuantity, selectedCurrencyInfo.currency) || '-'
  const isDarkMode = useIsDarkMode()

  return (
    <TouchableArea borderRadius="$roundedFull" disabled={disabled} testID={testID} onPress={onPress}>
      <Flex
        row
        alignItems="center"
        backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        flexDirection="row"
        gap="$gap8"
        p="$spacing12"
        shadowColor="$shadowColor"
        shadowOpacity={0.03}
        shadowRadius={4}
      >
        {loading ? (
          <SpinningLoader size={iconSizes.icon40} />
        ) : (
          <CurrencyLogo
            currencyInfo={selectedCurrencyInfo}
            networkLogoBorderWidth={spacing.spacing1}
            size={iconSizes.icon40}
          />
        )}
        <Flex grow>
          <Text color="$neutral1" variant="body2" testID={TestID.ForFormTokenSelected}>
            {selectedCurrencyInfo.currency.name}
          </Text>
          <Text color="$neutral2" variant="body3">
            Balance: {formattedAmount}
            {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
          </Text>
        </Flex>
        <RotatableChevron color="$neutral3" direction={chevronDirection} height={iconSizes.icon24} />
      </Flex>
    </TouchableArea>
  )
}
