import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ErrorCallout } from '~/components/ErrorCallout'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

export function PoolParsingError({ formComplete }: { formComplete: boolean }) {
  const { t } = useTranslation()
  const { poolOrPair, poolOrPairLoading, creatingPoolOrPair, refetchPoolData } = useCreateLiquidityContext()

  const shouldShowError = formComplete && !poolOrPair && !creatingPoolOrPair && !poolOrPairLoading

  if (!shouldShowError) {
    return null
  }

  return (
    <Trace logImpression element={ElementName.PoolParsingError}>
      <ErrorCallout
        errorMessage={true}
        description={t('pool.liquidity.parsing.error.message')}
        title={t('pool.liquidity.parsing.error')}
        action={t('pool.refresh.data')}
        onPress={refetchPoolData}
      />
    </Trace>
  )
}
