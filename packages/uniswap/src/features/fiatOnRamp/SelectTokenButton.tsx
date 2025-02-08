import { ComponentProps } from 'react'
import { Trans } from 'react-i18next'
import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, spacing } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo: Maybe<CurrencyInfo>
  formattedAmount: string
  disabled?: boolean
  loading?: boolean
  iconSize?: number
  chevronDirection?: ComponentProps<typeof RotatableChevron>['direction']
  testID?: TestIDType
}

export function SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  formattedAmount,
  disabled,
  loading,
  iconSize = iconSizes.icon24,
  chevronDirection = 'end',
  testID,
}: SelectTokenButtonProps): JSX.Element {
  const textColor = selectedCurrencyInfo ? '$neutral1' : '$white'
  const backgroundColor = selectedCurrencyInfo ? '$surface1' : '$accent1'

  return (
    <TouchableArea borderRadius="$roundedFull" disabled={disabled} testID={testID} onPress={onPress}>
      <Flex
        centered
        row
        flexDirection="row"
        gap="$none"
        pr="$spacing4"
        backgroundColor={backgroundColor}
        borderRadius="$roundedFull"
        p="$spacing4"
        borderColor="$surface3"
        borderWidth="$spacing1"
      >
        {selectedCurrencyInfo ? (
          <>
            {loading ? (
              <SpinningLoader />
            ) : (
              <CurrencyLogo
                currencyInfo={selectedCurrencyInfo}
                networkLogoBorderWidth={spacing.spacing1}
                size={iconSize}
              />
            )}
            <Text color={textColor} pl="$spacing8" variant="buttonLabel1">
              {formattedAmount}
            </Text>
            <Text color={textColor} pl="$spacing4" variant="buttonLabel1">
              {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
            </Text>
          </>
        ) : (
          <Text color={textColor} pl="$spacing4" variant="buttonLabel1">
            <Trans i18nKey="common.selectToken.label" />
          </Text>
        )}
        <RotatableChevron color={textColor} direction={chevronDirection} height={iconSizes.icon16} />
      </Flex>
    </TouchableArea>
  )
}
