import { useTranslation } from 'react-i18next'
import { Flex, Image, Text } from 'ui/src'
import { UNICHAIN_LOGO } from 'ui/src/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'

interface UnichainPoweredMessageProps {
  chainId?: UniverseChainId
}

export function UnichainPoweredMessage({ chainId }: UnichainPoweredMessageProps): JSX.Element | null {
  const { t } = useTranslation()
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

  if (!isFlashblocksEnabled) {
    return null
  }

  return (
    <Flex row centered gap="$spacing6" py="$spacing4" mb="$spacing8">
      <Image source={UNICHAIN_LOGO} width={16} height={16} />
      <Text color="magenta" variant="body4" textAlign="center">
        {t('swap.details.fasterUnichainSwaps')}
      </Text>
    </Flex>
  )
}
