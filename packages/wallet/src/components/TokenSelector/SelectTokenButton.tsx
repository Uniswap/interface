import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo?: CurrencyInfo | null
  testID?: TestIDType
}

export function SelectTokenButton({ selectedCurrencyInfo, onPress, testID }: SelectTokenButtonProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor={selectedCurrencyInfo ? '$surface3' : '$accent1'}
      borderRadius="$roundedFull"
      testID={testID}
      onPress={onPress}
    >
      {selectedCurrencyInfo ? (
        <Flex centered row gap="$spacing4" p="$spacing4" pr={isWeb ? undefined : '$spacing12'}>
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
          <Text color="$neutral1" pl="$spacing4" testID={`${testID}-label`} variant="buttonLabel1">
            {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
          </Text>
          {isWeb && (
            <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
          )}
        </Flex>
      ) : (
        <Flex
          centered
          row
          gap="$spacing4"
          pl="$spacing12"
          pr="$spacing12"
          py="$spacing8"
          {...(isWeb && {
            pl: '$spacing8',
            pr: '$spacing4',
            py: '$spacing4',
          })}
        >
          <Text color="$white" testID={`${testID}-label`} variant="buttonLabel2">
            {t('tokens.selector.button.choose')}
          </Text>
          {isWeb && (
            <RotatableChevron color="$white" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
          )}
        </Flex>
      )}
    </TouchableArea>
  )
}
