import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import { Action } from 'redux'
import { ServerOverrides } from 'src/components/experiments/ServerOverrides'
import { closeModal } from 'src/features/modals/modalSlice'
import { Accordion, Separator } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { GatingOverrides } from 'wallet/src/components/gating/GatingOverrides'

export function ExperimentsModal(): JSX.Element {
  const insets = useAppInsets()
  const dispatch = useDispatch()

  return (
    <Modal
      fullScreen
      renderBehindBottomInset
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          paddingRight: spacing.spacing24,
          paddingLeft: spacing.spacing24,
        }}
      >
        <Accordion collapsible gap="$spacing12" type="single">
          <ServerOverrides />
          <Separator />
          <GatingOverrides />
        </Accordion>
      </ScrollView>
    </Modal>
  )
}
