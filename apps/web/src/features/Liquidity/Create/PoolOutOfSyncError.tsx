import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ErrorCallout } from '~/components/ErrorCallout'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { useIsPoolOutOfSync } from '~/features/Liquidity/Create/hooks/useIsPoolOutOfSync'

export function PoolOutOfSyncError() {
  const { t } = useTranslation()

  const { creatingPoolOrPair, poolOrPair, refetchPoolData } = useCreateLiquidityContext()

  const isPoolOutOfSync = useIsPoolOutOfSync(poolOrPair)

  if (creatingPoolOrPair || !isPoolOutOfSync) {
    return null
  }

  return (
    <Trace logImpression element={ElementName.PoolOutOfSyncError} properties={{ isPoolOutOfSync }}>
      <ErrorCallout
        isWarning
        errorMessage={true}
        description={t('pool.liquidity.outOfSync.message')}
        title={t('pool.liquidity.outOfSync')}
        action={t('pool.refresh.prices')}
        onPress={refetchPoolData}
      />
    </Trace>
  )
}
