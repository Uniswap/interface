import { t } from 'i18next'
import { FadeIn } from 'react-native-reanimated'
import { Flex, isWeb, SpinningLoader, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
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
    <Flex centered row justifyContent={isWeb ? 'space-between' : 'center'} px="$spacing8">
      {isWeb && (
        <Text color="$neutral2" flexShrink={1} variant="body3">
          {t('send.gas.networkCost.title')}
        </Text>
      )}
      {gasFee.isLoading ? (
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
              <Gas color="$neutral2" size="$icon.16" />
              <Text color="$neutral2" variant="body3">
                {gasFeeFormatted}
              </Text>
            </AnimatedFlex>
          }
        />
      )}
    </Flex>
  )
}
