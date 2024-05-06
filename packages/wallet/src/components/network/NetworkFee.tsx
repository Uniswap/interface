import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { ChainId } from 'wallet/src/constants/chains'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'

export function NetworkFee({
  chainId,
  gasFee,
}: {
  chainId: ChainId
  gasFee: GasFeeResult
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatTokenPrice)

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <NetworkFeeWarning>
        <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
          {t('transaction.networkCost.label')}
        </Text>
      </NetworkFeeWarning>
      <Flex row alignItems="center" gap="$spacing8">
        <NetworkLogo chainId={chainId} shape="square" size={iconSizes.icon16} />
        {gasFee.loading ? (
          <SpinningLoader size={iconSizes.icon16} />
        ) : gasFee.error ? (
          <Text color="$neutral2" variant="body3">
            {t('common.text.notAvailable')}
          </Text>
        ) : (
          <Text color="$neutral1" variant="body3">
            {gasFeeFormatted}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
