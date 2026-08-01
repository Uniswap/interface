import React from 'react'
import { useWindowDimensions, View } from 'react-native'
import { FiatOnRampStackNavigator } from 'src/app/navigation/navigation'
import { FullScreenNavModal } from 'src/components/modals/FullScreenNavModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function FiatOnRampAggregatorModal(): JSX.Element {
  const { height } = useWindowDimensions()

  return (
    <FullScreenNavModal hideHandlebar={true} name={ModalName.FiatOnRampAggregator}>
      {/* Nested native-stack collapses to 0 height inside the bottom-sheet portal under New Arch; give it an explicit height host. */}
      <View style={{ height }}>
        <FiatOnRampStackNavigator />
      </View>
    </FullScreenNavModal>
  )
}
