import { ErrorCallout } from 'components/ErrorCallout'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useTranslation } from 'react-i18next'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export function PoolOutOfSyncError() {
  const { t } = useTranslation()

  const {
    derivedPositionInfo: { isPoolOutOfSync, refetchPoolData },
  } = useCreatePositionContext()

  if (!isPoolOutOfSync) {
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
