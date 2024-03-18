import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo?: CurrencyInfo | null
  testID?: string
}

export function SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  testID,
}: SelectTokenButtonProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor={selectedCurrencyInfo ? '$surface3' : '$accent1'}
      borderRadius="$roundedFull"
      testID={testID}
      onPress={onPress}>
      {selectedCurrencyInfo ? (
        <Flex centered row gap="$spacing4" p="$spacing4" pr="$spacing12">
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
          <Text color="$neutral1" pl="$spacing4" variant="buttonLabel1">
            {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
          </Text>
        </Flex>
      ) : (
        <Flex centered row px="$spacing12" py="$spacing4">
          <Text color="$sporeWhite" variant="buttonLabel2">
            {t('tokens.selector.button.choose')}
          </Text>
        </Flex>
      )}
    </TouchableArea>
  )
}
