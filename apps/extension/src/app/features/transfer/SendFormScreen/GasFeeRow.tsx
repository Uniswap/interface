import { t } from 'i18next'
import { FadeIn } from 'react-native-reanimated'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'

type GasFeeRowProps = {
  gasFee: GasFeeResult
  chainId: WalletChainId
}

export function GasFeeRow({ gasFee, chainId }: GasFeeRowProps): JSX.Element | null {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatTokenPrice)

  if (!gasFeeUSD) {
    return null
  }

  return (
    <Flex centered row justifyContent="space-between" px="$spacing8">
      <Text color="$neutral2" flexShrink={1} variant="body3">
        {t('send.gas.networkCost.title')}
      </Text>
      {gasFee.loading ? (
        <SpinningLoader size={iconSizes.icon16} />
      ) : gasFee.error ? (
        <Text color="$neutral2" variant="body3">
          {t('send.gas.error.title')}
        </Text>
      ) : (
        <NetworkFeeWarning
          placement="bottom"
          tooltipTrigger={
            <AnimatedFlex centered row entering={FadeIn} gap="$spacing4">
              <Text color="$neutral2" variant="body3">
                {gasFeeFormatted}
              </Text>
              <Gas color="$neutral2" size="$icon.16" />
            </AnimatedFlex>
          }
        />
      )}
    </Flex>
  )
}
