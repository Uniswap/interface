import React from 'react'
import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import InfoCircleIcon from 'ui/src/assets/icons/info-circle.svg'
import { iconSizes } from 'ui/src/theme'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { ChainId } from 'wallet/src/constants/chains'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'

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
  const colors = useSporeColors()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <TouchableArea onPress={onShowNetworkFeeInfo}>
        <Flex centered row gap="$spacing4">
          <Text variant="bodySmall">{t('Network fee')}</Text>
          <InfoCircleIcon
            color={colors.neutral1.val}
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </Flex>
      </TouchableArea>
      <Flex row alignItems="center" gap="$spacing8">
        <InlineNetworkPill chainId={chainId} />
        <Text variant="bodySmall">•</Text>
        {gasFee.loading ? (
          <SpinningLoader size={iconSizes.icon20} />
        ) : (
          <Flex row alignItems="center" justifyContent="space-between">
            {gasFee.error ? (
              <Text color="$neutral2" variant="bodySmall">
                {t('N/A')}
              </Text>
            ) : (
              <Text color="$neutral1" variant="bodySmall">
                {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
