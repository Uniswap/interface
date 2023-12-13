import { useApolloClient } from '@apollo/client'
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
import { useExperimentWithExposureLoggingDisabled } from 'statsig-react-native'
import { Accordion } from 'tamagui'
import { Button, Flex, Icons, Text, useDeviceInsets } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { EXPERIMENT_NAMES, FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlagWithExposureLoggingDisabled } from 'wallet/src/features/experiments/hooks'

export function ExperimentsModal(): JSX.Element {
  const insets = useDeviceInsets()
  const dispatch = useAppDispatch()
  const customEndpoint = useAppSelector(selectCustomEndpoint)

  const apollo = useApolloClient()

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
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          paddingRight: spacing.spacing24,
          paddingLeft: spacing.spacing24,
        }}>
        <Accordion type="single">
          <Accordion.Item value="graphql-endpoint">
            <AccordionHeader title="⚙️ Custom GraphQL Endpoint" />

            <Accordion.Content>
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

              <Flex grow row alignItems="center" gap="$spacing16">
                <Button flex={1} size="small" onPress={setEndpoint}>
                  Set
                </Button>

                <Button flex={1} size="small" onPress={clearEndpoint}>
                  Clear
                </Button>
              </Flex>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="apollo-cache">
            <AccordionHeader title="🚀 Apollo Cache" />

            <Accordion.Content>
              <Button
                flex={1}
                size="small"
                onPress={async (): Promise<unknown> => await apollo.resetStore()}>
                Reset Cache
              </Button>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="feature-flags">
            <AccordionHeader title="⛳️ Feature Flags" />

            <Accordion.Content>
              <Text variant="body2">
                Overridden feature flags are reset when the app is restarted
              </Text>

              <Flex gap="$spacing12" mt="$spacing12">
                {Object.values(FEATURE_FLAGS).map((featureFlag) => {
                  return <FeatureFlagRow key={featureFlag} featureFlag={featureFlag} />
                })}
              </Flex>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="experiments">
            <AccordionHeader title="🔬 Experiments" />

            <Accordion.Content>
              <Text variant="body2">
                Overridden experiments are reset when the app is restarted
              </Text>

              <Flex gap="$spacing12" mt="$spacing12">
                {Object.values(EXPERIMENT_NAMES).map((experiment) => {
                  return <ExperimentRow key={experiment} name={experiment} />
                })}
              </Flex>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </ScrollView>
    </BottomSheetModal>
  )
}

function AccordionHeader({ title }: { title: React.ReactNode }): JSX.Element {
  return (
    <Accordion.Header mt="$spacing12">
      <Accordion.Trigger>
        {({ open }: { open: boolean }): JSX.Element => (
          <>
            <Flex row justifyContent="space-between" width="100%">
              <Text variant="subheading1">{title}</Text>
              <Icons.RotatableChevron direction={open ? 'up' : 'down'} />
            </Flex>
          </>
        )}
      </Accordion.Trigger>
    </Accordion.Header>
  )
}

function FeatureFlagRow({ featureFlag }: { featureFlag: FEATURE_FLAGS }): JSX.Element {
  const status = useFeatureFlagWithExposureLoggingDisabled(featureFlag)

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
  const experiment = useExperimentWithExposureLoggingDisabled(name)

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
