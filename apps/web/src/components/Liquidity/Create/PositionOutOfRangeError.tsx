import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ErrorCallout } from 'components/ErrorCallout'
import { PositionInfo } from 'components/Liquidity/types'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { setOpenModal } from 'state/application/reducer'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function PositionOutOfRangeError({ positionInfo }: { positionInfo?: PositionInfo }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  if (positionInfo?.status !== PositionStatus.OUT_OF_RANGE) {
    return null
  }

  return (
    <ErrorCallout
      isWarning
      errorMessage={true}
      description={t('position.provide.outOfRange.description')}
      title={t('position.provide.outOfRange.title')}
      action={t('position.provide.outOfRange.closePosition')}
      onPress={() => dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: positionInfo }))}
      pressIcon={null}
    />
  )
}
