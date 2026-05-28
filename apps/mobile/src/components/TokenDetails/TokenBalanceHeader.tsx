import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import type { DataApiOutageProps, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

type TokenBalanceHeaderProps = {
  balance: PortfolioBalance
  isReadonly: boolean
  displayName?: string
} & DataApiOutageProps

export function TokenBalanceHeader({
  balance,
  isReadonly,
  displayName,
  isOutage,
  dataUpdatedAt,
}: TokenBalanceHeaderProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { isTestnetModeEnabled } = useEnabledChains()

  const [isOutageSheetOpen, setIsOutageSheetOpen] = useState(false)
  const handleOutagePress = useEvent(() => setIsOutageSheetOpen(true))
  const handleOutageSheetClose = useEvent(() => setIsOutageSheetOpen(false))

  const fiatBalance = convertFiatAmountFormatted(balance.balanceUSD, NumberType.FiatTokenDetails)
  const tokenBalance = `${formatNumberOrString({ value: balance.quantity, type: NumberType.TokenNonTx })} ${getSymbolDisplayText(balance.currencyInfo.currency.symbol)}`

  return (
    <Flex row>
      <Flex fill gap="$spacing8">
        <TouchableArea disabled={!isOutage} onPress={handleOutagePress}>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" variant="subheading2">
              {isReadonly
                ? t('token.balances.viewOnly', { ownerAddress: displayName ?? '' })
                : t('token.balances.main')}
            </Text>
            {isOutage && <AlertTriangleFilled color="$neutral2" size="$icon.16" />}
          </Flex>
        </TouchableArea>
        <Flex row gap="$spacing8" alignItems="flex-end">
          <Text variant="heading3">{isTestnetModeEnabled ? tokenBalance : fiatBalance}</Text>
          <Text color="$neutral2" variant="body2" lineHeight="$large">
            {!isTestnetModeEnabled && tokenBalance}
          </Text>
        </Flex>
      </Flex>
      <DataApiOutageModalContent
        isOpen={isOutageSheetOpen}
        lastUpdatedAt={dataUpdatedAt}
        onClose={handleOutageSheetClose}
      />
    </Flex>
  )
}
