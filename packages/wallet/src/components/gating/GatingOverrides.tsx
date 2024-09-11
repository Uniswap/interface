import React from 'react'
import { Accordion, Button, Flex, Input, Separator, Switch, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, WALLET_FEATURE_FLAG_NAMES, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { Statsig, useExperiment } from 'uniswap/src/features/gating/sdk/statsig'

export function GatingOverrides(): JSX.Element {
  const featureFlagRows: JSX.Element[] = []
  for (const [flag, flagName] of WALLET_FEATURE_FLAG_NAMES.entries()) {
    featureFlagRows.push(<FeatureFlagRow key={flagName} flag={flag} />)
  }

  const experimentRows: JSX.Element[] = []
  for (const experiment of Object.values(Experiments)) {
    experimentRows.push(<ExperimentRow key={experiment} experiment={experiment} />)
  }

  return (
    <>
      <Text variant="heading3">Gating</Text>

      <Accordion.Item value="feature-flags">
        <AccordionHeader title="⛳️ Feature Flags" />

        <Accordion.Content>
          <Button p="$spacing4" theme="tertiary" onPress={() => Statsig.removeGateOverride()}>
            <Text variant="body2">Clear all local feature gate overrides</Text>
          </Button>

          <Flex gap="$spacing12" mt="$spacing12">
            {featureFlagRows}
          </Flex>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="experiments">
        <AccordionHeader title="🔬 Experiments" />

        <Accordion.Content>
          <Button p="$spacing4" theme="tertiary" onPress={() => Statsig.removeConfigOverride()}>
            <Text variant="body2">Clear all local experiment/config overrides</Text>
          </Button>

          <Flex gap="$spacing12" mt="$spacing12">
            {experimentRows}
          </Flex>
        </Accordion.Content>
      </Accordion.Item>

      <Button
        mt="$spacing12"
        p="$spacing4"
        theme="tertiary"
        onPress={() => {
          Statsig.removeGateOverride()
          Statsig.removeConfigOverride()
          Statsig.removeLayerOverride()
        }}
      >
        <Text variant="body2">Clear all gating overrides</Text>
      </Button>
    </>
  )
}

export function AccordionHeader({ title }: { title: React.ReactNode }): JSX.Element {
  return (
    <Accordion.Header mt="$spacing12">
      <Accordion.Trigger width="100%">
        {({ open }: { open: boolean }): JSX.Element => (
          <>
            <Flex row justifyContent="space-between">
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

  return (
    <Flex row alignItems="center" gap="$spacing16" justifyContent="space-between">
      <Text variant="body1">{name}</Text>
      <Switch
        checked={status}
        variant="branded"
        onCheckedChange={(newValue: boolean): void => {
          Statsig.overrideGate(name, newValue)
        }}
      />
    </Flex>
  )
}

function ExperimentRow({ experiment }: { experiment: Experiments }): JSX.Element {
  const { config } = useExperiment(experiment)

  const paramRows = Object.entries(config.value).map(([key, value]) => {
    let valueElement: JSX.Element | undefined
    if (typeof value === 'boolean') {
      valueElement = (
        <Switch
          checked={value}
          variant="branded"
          onCheckedChange={(newValue: boolean): void => {
            Statsig.overrideConfig(experiment, {
              ...config.value,
              [key]: newValue,
            })
          }}
        />
      )
    } else if (typeof value === 'number') {
      valueElement = (
        <Input
          value={value.toString()}
          onChangeText={(newValue: string): void => {
            Statsig.overrideConfig(experiment, {
              ...config.value,
              [key]: Number(newValue),
            })
          }}
        />
      )
    } else if (typeof value === 'string') {
      valueElement = (
        <Input
          value={value}
          onChangeText={(newValue: string): void => {
            Statsig.overrideConfig(experiment, {
              ...config.value,
              [key]: newValue,
            })
          }}
        />
      )
    }

    return (
      valueElement && (
        <Flex key={key} row alignItems="center" gap="$spacing16" justifyContent="space-between">
          <Text variant="body1">{key}</Text>
          {valueElement}
        </Flex>
      )
    )
  })

  return (
    <>
      <Separator />
      <Flex>
        <Text variant="body1">{experiment}</Text>
        <Flex>
          <Flex key={experiment} gap="$spacing8" paddingStart="$spacing8">
            {paramRows}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
