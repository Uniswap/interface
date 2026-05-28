import React from 'react'
import { FiatOnRampStackNavigator } from 'src/app/navigation/navigation'
import { FullScreenNavModal } from 'src/components/modals/FullScreenNavModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function FiatOnRampAggregatorModal(): JSX.Element {
  return (
    <FullScreenNavModal hideHandlebar={true} name={ModalName.FiatOnRampAggregator}>
      <FiatOnRampStackNavigator />
    </FullScreenNavModal>
  )
}
