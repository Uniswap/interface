import React, { useState } from 'react'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { Switch } from 'src/components/buttons/Switch'
import { TextInput } from 'src/components/input/TextInput'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { setCustomEndpoint } from 'src/features/tweaks/slice'
import { Statsig } from 'statsig-react'
import { Flex, Text } from 'ui/src'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'

export function ExperimentsModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const customEndpoint = useAppSelector(selectCustomEndpoint)

  const [url, setUrl] = useState<string>(customEndpoint?.url || '')
  const [key, setKey] = useState<string>(customEndpoint?.key || '')

  const clearEndpoint = (): void => {
    dispatch(setCustomEndpoint({}))
    setUrl('')
    setKey('')
  }

  const setEndpoint = (): void => {
    if (url && key) {
      dispatch(
        setCustomEndpoint({
          customEndpoint: { url, key },
        })
      )
    } else {
      clearEndpoint()
    }
  }

  return (
    <BottomSheetModal
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}>
      <Flex
        gap="$spacing16"
        justifyContent="flex-start"
        pb="$spacing36"
        pt="$spacing12"
        px="$spacing24">
        <Flex gap="$spacing8">
          <Flex gap="$spacing16" my="$spacing16">
            <Text variant="subheadLarge">⚙️ Custom GraphQL Endpoint</Text>
            <Text variant="bodySmall">
              You will need to restart the application to pick up any changes in this section.
              Beware of client side caching!
            </Text>
            <Flex row alignItems="center" gap="$spacing16">
              <Text variant="bodySmall">URL</Text>
              <TextInput flex={1} value={url} onChangeText={setUrl} />
            </Flex>
            <Flex row alignItems="center" gap="$spacing16">
              <Text variant="bodySmall">Key</Text>
              <TextInput flex={1} value={key} onChangeText={setKey} />
            </Flex>
            <Button label="Set" size={ButtonSize.Small} onPress={setEndpoint} />
            <Button label="Clear" size={ButtonSize.Small} onPress={clearEndpoint} />
          </Flex>
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
    <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
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
