import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { Stopwatch } from 'ui/src/components/icons/Stopwatch'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'

interface ExpectedSpeedProps {
  chainId: UniverseChainId
}

export function ExpectedSpeed({ chainId }: ExpectedSpeedProps): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

  if (!isFlashblocksEnabled) {
    return null
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="$neutral2" variant="body3">
        {t('swap.details.expectedSpeed')}
      </Text>
      <Flex row alignItems="center" gap="$spacing2">
        <Stopwatch size="$icon.16" color={colors.accent1.val} />
        <Text color="$neutral1" variant="body3">
          {t('swap.details.instant')}
        </Text>
      </Flex>
    </Flex>
  )
}
