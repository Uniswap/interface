import React from 'react'
import { Accordion, Flex, Separator, Text, isWeb, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import {
  Experiments,
  WALLET_EXPERIMENTS,
  getExperimentDefinition,
} from 'uniswap/src/features/gating/experiments'
import {
  FeatureFlags,
  WALLET_FEATURE_FLAG_NAMES,
  getFeatureFlagName,
} from 'uniswap/src/features/gating/flags'
import {
  useExperimentValueWithExposureLoggingDisabled,
  useFeatureFlagWithExposureLoggingDisabled,
} from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { Switch, WebSwitch } from 'wallet/src/components/buttons/Switch'

export function GatingOverrides(): JSX.Element {
  const featureFlagRows: JSX.Element[] = []
  for (const [flag, flagName] of WALLET_FEATURE_FLAG_NAMES.entries()) {
    featureFlagRows.push(<FeatureFlagRow key={flagName} flag={flag} />)
  }

  const experimentRows: JSX.Element[] = []
  for (const [experiment, experimentDef] of WALLET_EXPERIMENTS.entries()) {
    experimentRows.push(<ExperimentRow key={experimentDef.name} experiment={experiment} />)
  }

  return (
    <>
      <Accordion.Item value="feature-flags">
        <AccordionHeader title="⛳️ Feature Flags" />

        <Accordion.Content>
          <Text variant="body2">Overridden feature flags are reset when the app is restarted</Text>

          <Flex gap="$spacing12" mt="$spacing12">
            {featureFlagRows}
          </Flex>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="experiments">
        <AccordionHeader title="🔬 Experiments" />

        <Accordion.Content>
          <Text variant="body2">Overridden experiments are reset when the app is restarted</Text>

          <Flex gap="$spacing24" mt="$spacing12">
            {experimentRows}
          </Flex>
        </Accordion.Content>
      </Accordion.Item>
    </>
  )
}

export function AccordionHeader({ title }: { title: React.ReactNode }): JSX.Element {
  return (
    <Accordion.Header mt="$spacing12">
      <Accordion.Trigger>
        {({ open }: { open: boolean }): JSX.Element => (
          <>
            <Flex row justifyContent="space-between" width="100%">
              <Text variant="subheading1">{title}</Text>
              <RotatableChevron direction={open ? 'up' : 'down'} />
            </Flex>
          </>
        )}
      </Accordion.Trigger>
    </Accordion.Header>
  )
}

function FeatureFlagRow({ flag }: { flag: FeatureFlags }): JSX.Element {
  const status = useFeatureFlagWithExposureLoggingDisabled(flag)
  const name = getFeatureFlagName(flag)

  const SwitchElement = isWeb ? WebSwitch : Switch

  return (
    <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
      <Text variant="body1">{name}</Text>
      <SwitchElement
        value={status}
        onValueChange={(newValue: boolean): void => {
          Statsig.overrideGate(name, newValue)
        }}
      />
    </Flex>
  )
}

function ExperimentRow({ experiment }: { experiment: Experiments }): JSX.Element {
  const experimentDef = getExperimentDefinition(experiment)

  return (
    <>
      <Separator />
      <Flex>
        <Text variant="body1">{experimentDef.name}</Text>
        <Flex gap="$spacing4">
          <Flex
            key={experimentDef.name}
            row
            alignItems="center"
            gap="$spacing16"
            justifyContent="space-between"
            paddingStart="$spacing16">
            <Text variant="body2" />
            <ExperimentValueSwitch experiment={experiment} />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

function ExperimentValueSwitch({ experiment }: { experiment: Experiments }): JSX.Element {
  const colors = useSporeColors()
  const experimentDef = getExperimentDefinition(experiment)
  const currentValue = useExperimentValueWithExposureLoggingDisabled(experiment)

  return (
    <Flex gap="$spacing8">
      {experimentDef.values.map((value) => (
        <Flex
          key={value}
          gap="$spacing4"
          onPressOut={() => {
            Statsig.overrideConfig(experimentDef.name, {
              [experimentDef.key]: value,
            })
          }}>
          <Text color={value === currentValue ? colors.accent1.val : colors.neutral1.val}>
            {value}
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}
