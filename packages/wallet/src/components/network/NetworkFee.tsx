import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { InlineNetworkPill } from 'wallet/src/components/network/NetworkPill'
import { ChainId } from 'wallet/src/constants/chains'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

export function NetworkFee({
  chainId,
  gasFee,
  onShowNetworkFeeInfo,
}: {
  chainId: ChainId
  gasFee: GasFeeResult
  onShowNetworkFeeInfo?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatTokenPrice)

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      <TouchableArea flexShrink={1} onPress={onShowNetworkFeeInfo}>
        <Flex row shrink alignItems="center" gap="$spacing4">
          <Text color="$neutral2" flexShrink={1} numberOfLines={3} variant="body3">
            {t('Network cost')}
            &nbsp;
            <Icons.InfoCircleFilled color="$neutral3" size="$icon.16" />
          </Text>
        </Flex>
      </TouchableArea>
      <Flex row alignItems="center" gap="$spacing8">
        <InlineNetworkPill chainId={chainId} />
        {gasFee.loading ? (
          <SpinningLoader size={iconSizes.icon16} />
        ) : gasFee.error ? (
          <Text color="$neutral2" variant="body3">
            {t('N/A')}
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
