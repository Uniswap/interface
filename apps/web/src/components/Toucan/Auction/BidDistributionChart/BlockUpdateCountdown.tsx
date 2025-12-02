import { useBlockCountdown } from 'hooks/useBlockCountdown'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'

interface BlockUpdateCountdownProps {
  chainId: EVMUniverseChainId | undefined
}

export const BlockUpdateCountdown = ({ chainId }: BlockUpdateCountdownProps) => {
  const { t } = useTranslation()
  const countdown = useBlockCountdown(chainId)

  if (countdown === undefined) {
    return null
  }

  return (
    <Text variant="body4" color="$neutral3">
      {t('toucan.auction.nextBlockUpdate', { seconds: Math.ceil(countdown) })}
    </Text>
  )
}
