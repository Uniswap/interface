import { Trans, useTranslation } from 'react-i18next'
import { Button, ColorTokens, Flex, Text } from 'ui/src'
import { ChainId } from 'wallet/src/constants/chains'
import { WarningLabel } from 'wallet/src/features/transactions/WarningModal/types'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedSwapWarnings'
import { useNetworkColors } from 'wallet/src/utils/colors'

export function SwapBuyTokenRow(): JSX.Element | null {
  const { t } = useTranslation()
  const { formScreenWarning } = useParsedSwapWarnings()
  const warning = formScreenWarning?.warning
  const showRow = warning && warning.type === WarningLabel.InsufficientGasFunds && warning.currency
  const networkColors = useNetworkColors(warning?.currency?.chainId ?? ChainId.Mainnet)
  const currencySymbol = warning?.currency?.symbol

  if (!showRow) {
    return null
  }

  return (
    <Flex
      centered
      row
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={1}
      p="$spacing12">
      <Flex fill>
        <Text color="$neutral2" variant="body4">
          <Trans
            components={{
              highlight: <Text style={{ color: networkColors.foreground }} variant="body4" />,
            }}
            i18nKey="swap.warning.insufficientGas.cta.message"
            values={{ currencySymbol }}
          />
        </Text>
      </Flex>
      <Button
        backgroundless
        backgroundColor={networkColors.background as ColorTokens}
        borderRadius="$rounded20"
        hoverStyle={{ backgroundColor: networkColors.background as ColorTokens }}
        pressStyle={{ backgroundColor: networkColors.background as ColorTokens }}
        px="$spacing12"
        py="$spacing8">
        <Text color={networkColors.foreground as ColorTokens} variant="buttonLabel4">
          {t('swap.warning.insufficientGas.cta.button', {
            currencySymbol: warning.currency?.symbol,
          })}
        </Text>
      </Button>
    </Flex>
  )
}
