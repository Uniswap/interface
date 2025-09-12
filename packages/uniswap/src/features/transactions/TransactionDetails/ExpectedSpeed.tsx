import { useTranslation } from 'react-i18next'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { EstimatedTime } from 'uniswap/src/features/transactions/TransactionDetails/EstimatedTime'

interface ExpectedSpeedProps {
  chainId: UniverseChainId
}

export function ExpectedSpeed({ chainId }: ExpectedSpeedProps): JSX.Element | null {
  const { t } = useTranslation()
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

  if (!isFlashblocksEnabled) {
    return null
  }

  return <EstimatedTime contentText={t('swap.details.instant')} showIcon={true} />
}
