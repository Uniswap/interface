import React from 'react'
import { useTranslation } from 'react-i18next'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { ChainId } from 'wallet/src/constants/chains'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'

export function NetworkFee({
  chainId,
  gasFee,
}: {
  chainId: ChainId
  gasFee: GasFeeResult
}): JSX.Element {
  const { t } = useTranslation()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="bodySmall">{t('Network fee')}</Text>
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
