import React, { useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Switch } from 'src/components/buttons/Switch'
import { TextInput } from 'src/components/input/TextInput'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { setCustomEndpoint } from 'src/features/tweaks/slice'
import { Statsig } from 'statsig-react'
import { useExperiment } from 'statsig-react-native'
import { Button, Flex, Text, useDeviceInsets } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { EXPERIMENT_NAMES, FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'

export function ExperimentsModal(): JSX.Element {
  const insets = useDeviceInsets()
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
      fullScreen
      renderBehindBottomInset
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.spacing12 }}>
        <Flex gap="$spacing16" justifyContent="flex-start" pt="$spacing12" px="$spacing24">
          <Flex gap="$spacing8">
            <Flex gap="$spacing16" my="$spacing16">
              <Text variant="subheading1">⚙️ Custom GraphQL Endpoint</Text>
              <Text variant="body2">
                You will need to restart the application to pick up any changes in this section.
                Beware of client side caching!
              </Text>
              <Flex row alignItems="center" gap="$spacing16">
                <Text variant="body2">URL</Text>
                <TextInput flex={1} value={url} onChangeText={setUrl} />
              </Flex>
              <Flex row alignItems="center" gap="$spacing16">
                <Text variant="body2">Key</Text>
                <TextInput flex={1} value={key} onChangeText={setKey} />
              </Flex>
              <Button size="small" onPress={setEndpoint}>
                Set
              </Button>
              <Button size="small" onPress={clearEndpoint}>
                Clear
              </Button>
            </Flex>
            <Text variant="subheading1">⛳️ Feature Flags</Text>
            <Text variant="body2">
              Overridden feature flags are reset when the app is restarted
            </Text>
          </Flex>
          {Object.values(FEATURE_FLAGS).map((featureFlag) => {
            return <FeatureFlagRow key={featureFlag} featureFlag={featureFlag} />
          })}
          <Text variant="subheading1">🔬 Experiments</Text>
          <Text variant="body2">Overridden experiments are reset when the app is restarted</Text>
          {Object.values(EXPERIMENT_NAMES).map((experiment) => {
            return <ExperimentRow key={experiment} name={experiment} />
          })}
        </Flex>
      </ScrollView>
    </BottomSheetModal>
  )
}

function FeatureFlagRow({ featureFlag }: { featureFlag: FEATURE_FLAGS }): JSX.Element {
  const status = useFeatureFlag(featureFlag)

  return (
    <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
      <Text variant="body1">{featureFlag}</Text>
      <Switch
        value={status}
        onValueChange={(newValue: boolean): void => {
          Statsig.overrideGate(featureFlag, newValue)
        }}
      />
    </Flex>
  )
}

function ExperimentRow({ name }: { name: string }): JSX.Element {
  const experiment = useExperiment(name)
  // console.log('garydebug experiment row ' + JSON.stringify(experiment.config))
  // const layer = useLayer(name)
  // console.log('garydebug experiment row ' + JSON.stringify(layer))

  const params = Object.entries(experiment.config.value).map(([key, value]) => (
    <Flex
      row
      alignItems="center"
      gap="$spacing16"
      justifyContent="space-between"
      paddingStart="$spacing16">
      <Text variant="body1">{key}</Text>
      {typeof value === 'boolean' && (
        <Switch
          value={value}
          onValueChange={(newValue: boolean): void => {
            Statsig.overrideConfig(name, { ...experiment.config.value, [key]: newValue })
          }}
        />
      )}
    </Flex>
  ))

  return (
    <Flex>
      <Text variant="body1">{name}</Text>
      <Flex gap="$spacing4">{params}</Flex>
    </Flex>
  )
}
