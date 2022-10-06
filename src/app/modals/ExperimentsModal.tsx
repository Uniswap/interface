import { Experiment } from '@amplitude/experiment-react-native-client'
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Switch } from 'src/components/buttons/Switch'
import { TextInput } from 'src/components/input/TextInput'
import { Flex } from 'src/components/layout/Flex'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import {
  selectExperimentOverrides,
  selectFeatureFlagOverrides,
} from 'src/features/experiments/selectors'
import {
  addExperimentOverride,
  addFeatureFlagOverride,
  mergeRemoteConfig,
  resetExperimentOverrides,
  resetFeatureFlagOverrides,
} from 'src/features/experiments/slice'
import { closeModal, selectExperimentsState } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'

export type FeatureFlag = {
  name: string
  enabled: boolean
}

export type Experiment = {
  name: string
  variant: string
}

export function ExperimentsModal() {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const modalState = useAppSelector(selectExperimentsState)

  const featureFlags = useAppSelector(selectFeatureFlagOverrides)
  const experiments = useAppSelector(selectExperimentOverrides)
  const [remoteFeatureFlags, setRemoteFeatureFlags] = useState<FeatureFlag[]>([])
  const [remoteExperiments, setRemoteExperiments] = useState<Experiment[]>([])

  useEffect(() => {
    const retrieveAndSyncRemoteExperiments = async () => {
      const fetchedAmplitudeExperiments = await Experiment.all()

      const fetchedFeatureFlags: FeatureFlag[] = []
      const fetchedExperiments: Experiment[] = []

      Object.keys(fetchedAmplitudeExperiments).map((experimentKey) => {
        const variant = fetchedAmplitudeExperiments[experimentKey].value
        if (['on'].includes(variant)) {
          fetchedFeatureFlags.push({ name: experimentKey, enabled: variant === 'on' })
        } else {
          fetchedExperiments.push({ name: experimentKey, variant: variant })
        }
      })
      setRemoteExperiments(fetchedExperiments)
      setRemoteFeatureFlags(fetchedFeatureFlags)
      dispatch(
        mergeRemoteConfig({ experiments: fetchedExperiments, featureFlags: fetchedFeatureFlags })
      )
    }

    retrieveAndSyncRemoteExperiments()
  }, [dispatch])

  return (
    <BottomSheetModal
      backgroundColor={
        featureFlags['modal-color-test']
          ? theme.colors.accentBranded
          : theme.colors.backgroundSurface
      }
      isVisible={modalState.isOpen}
      name={ModalName.Experiments}
      onClose={() => dispatch(closeModal({ name: ModalName.Experiments }))}>
      <Flex gap="lg" justifyContent="flex-start" pb="xl">
        <Flex>
          <Text color="textPrimary" px="lg">
            Overidden feature flags and experiment variants will remain in the overriden state until
            you reset them. Remote config is refreshed every time you cold-start the app, and
            differences show in color.
          </Text>
        </Flex>

        <Flex justifyContent="flex-start" px="lg">
          <SectionHeader
            emoji="🏴"
            title="Feature Flags"
            onResetPress={() => {
              dispatch(resetFeatureFlagOverrides(remoteFeatureFlags))
            }}
          />
          {Object.keys(featureFlags).map((name) => {
            return (
              <FeatureFlagRow
                key={name}
                localFeatureFlags={featureFlags}
                name={name}
                remoteFeatureFlags={remoteFeatureFlags}
              />
            )
          })}
        </Flex>

        <Flex justifyContent="flex-start" px="lg">
          <SectionHeader
            emoji="🧪"
            title="Experiments"
            onResetPress={() => {
              dispatch(resetExperimentOverrides(remoteExperiments))
            }}
          />
          {Object.keys(experiments).map((name) => {
            return (
              <ExperimentRow
                key={name}
                localExperiments={experiments}
                name={name}
                remoteExperiments={remoteExperiments}
              />
            )
          })}
        </Flex>
        {/* // Spacer for keyboard input */}
        <Flex height={300} />
      </Flex>
    </BottomSheetModal>
  )
}

function SectionHeader({
  title,
  emoji,
  onResetPress,
}: {
  title: string
  emoji: string
  onResetPress: () => void
}) {
  return (
    <Flex
      row
      alignItems="center"
      borderBottomColor="textPrimary"
      borderBottomWidth={0.5}
      gap="sm"
      justifyContent="space-between"
      py="xs">
      <Flex row gap="sm">
        <Text variant="subhead">{emoji}</Text>
        <Text variant="subhead">{title}</Text>
      </Flex>
      <PrimaryButton
        label="Reset"
        p="xs"
        textVariant="badge"
        variant="paleOrange"
        onPress={onResetPress}
      />
    </Flex>
  )
}

function ExperimentRow({
  name,
  localExperiments,
  remoteExperiments,
}: {
  name: string
  localExperiments: {
    [name: string]: string
  }
  remoteExperiments: Experiment[]
}) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const [textInput, setTextInput] = useState<string | undefined>()

  const isExperimentOverridden =
    localExperiments[name] !==
    remoteExperiments.find((experiment) => experiment.name === name)?.variant
  return (
    <Flex gap="xs">
      <Flex row alignItems="center" flexWrap="wrap" gap="none" justifyContent="space-between">
        <Text m="none" p="none" variant="body">
          {name}
        </Text>
        <Flex row alignItems="center" gap="none" justifyContent="flex-end">
          <TextInput
            autoCapitalize="none"
            backgroundColor="none"
            color={isExperimentOverridden ? 'accentAction' : 'textPrimary'}
            placeholder={localExperiments[name]}
            placeholderTextColor={
              isExperimentOverridden ? theme.colors.accentAction : theme.colors.textPrimary
            }
            onChangeText={(text) => setTextInput(text)}
          />
          <PrimaryButton
            label="Override"
            p="xs"
            textVariant="badge"
            variant="blue"
            onPress={() => {
              if (!textInput) return
              dispatch(addExperimentOverride({ name: name, variant: textInput }))
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

function FeatureFlagRow({
  name,
  localFeatureFlags,
  remoteFeatureFlags,
}: {
  name: string
  localFeatureFlags: {
    [name: string]: boolean
  }
  remoteFeatureFlags: FeatureFlag[]
}) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const isExperimentOverridden =
    localFeatureFlags[name] !== remoteFeatureFlags.find((flag) => name === flag.name)?.enabled
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="body">{name}</Text>
      <Switch
        thumbColor={isExperimentOverridden ? theme.colors.accentAction : theme.colors.accentActive}
        value={localFeatureFlags[name]}
        onValueChange={(newValue: boolean) => {
          dispatch(addFeatureFlagOverride({ name: name, enabled: newValue }))
        }}
      />
    </Flex>
  )
}
