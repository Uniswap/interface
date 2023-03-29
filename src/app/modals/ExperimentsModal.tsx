import React from 'react'
import { Action } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { Switch } from 'src/components/buttons/Switch'
import { Flex } from 'src/components/layout/Flex'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { FEATURE_FLAGS } from 'src/features/experiments/constants'
import { useFeatureFlag } from 'src/features/experiments/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Statsig } from 'statsig-react'

export function ExperimentsModal(): JSX.Element {
  const dispatch = useAppDispatch()

  return (
    <BottomSheetModal
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}>
      <Flex
        gap="spacing16"
        justifyContent="flex-start"
        pb="spacing36"
        pt="spacing12"
        px="spacing24">
        <Flex gap="spacing8">
          <Text variant="subheadLarge">⛳️ Feature Flags</Text>
          <Text variant="bodySmall">
            Overridden feature flags are reset when the app is restarted
          </Text>
        </Flex>
        {Object.values(FEATURE_FLAGS).map((featureFlag) => {
          return <FeatureFlagRow key={featureFlag} featureFlag={featureFlag} />
        })}
      </Flex>
    </BottomSheetModal>
  )
}

function FeatureFlagRow({ featureFlag }: { featureFlag: FEATURE_FLAGS }): JSX.Element {
  const status = useFeatureFlag(featureFlag)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="bodyLarge">{featureFlag}</Text>
      <Switch
        value={status}
        onValueChange={(newValue: boolean): void => {
          Statsig.overrideGate(featureFlag, newValue)
        }}
      />
    </Flex>
  )
}
