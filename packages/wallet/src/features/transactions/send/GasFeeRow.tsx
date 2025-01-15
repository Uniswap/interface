import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { Flex, isWeb, SpinningLoader, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { NetworkFeeWarning } from 'uniswap/src/features/transactions/swap/modals/NetworkFeeWarning'

type GasFeeRowProps = {
  gasFee: GasFeeResult
  chainId: UniverseChainId
}

export function GasFeeRow({ gasFee, chainId }: GasFeeRowProps): JSX.Element | null {
  const { t } = useTranslation()
  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: undefined,
  })

  if (!gasFeeFormatted) {
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
