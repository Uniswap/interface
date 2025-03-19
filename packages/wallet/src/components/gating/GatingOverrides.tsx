import React from 'react'
import { Accordion, Flex, Input, Separator, Switch, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, WALLET_FEATURE_FLAG_NAMES, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { Statsig, useExperiment } from 'uniswap/src/features/gating/sdk/statsig'
import { isMobileApp } from 'utilities/src/platform'
import { GatingButton } from 'wallet/src/components/gating/GatingButton'

export function GatingOverrides(): JSX.Element {
  const featureFlagRows: JSX.Element[] = []
  const sortedFlags = Array.from(WALLET_FEATURE_FLAG_NAMES.entries()).sort(([, nameA], [, nameB]) =>
    nameA.localeCompare(nameB),
  )

  for (const [flag, flagName] of sortedFlags) {
    featureFlagRows.push(<FeatureFlagRow key={flagName} flag={flag} />)
  }

  const experimentRows: JSX.Element[] = []
  for (const experiment of Object.values(Experiments)) {
    experimentRows.push(<ExperimentRow key={experiment} experiment={experiment} />)
  }

  return (
    <>
      <Text variant="heading3">Gating</Text>
      <Flex flexDirection="column">
        <Accordion.Item value="feature-flags">
          <AccordionHeader title="⛳️ Feature Flags" />

          <Accordion.Content>
            <GatingButton onPress={() => Statsig.removeGateOverride()}>
              Clear all local feature gate overrides
            </GatingButton>

            <Flex gap="$spacing12" mt="$spacing12">
              {featureFlagRows}
            </Flex>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="experiments">
          <AccordionHeader title="🔬 Experiments" />

          <Accordion.Content>
            <GatingButton onPress={() => Statsig.removeConfigOverride()}>
              Clear all local experiment/config overrides
            </GatingButton>

            <Flex gap="$spacing12" mt="$spacing12">
              {experimentRows}
            </Flex>
          </Accordion.Content>
        </Accordion.Item>
      </Flex>

      <GatingButton
        mt="$spacing12"
        onPress={() => {
          Statsig.removeGateOverride()
          Statsig.removeConfigOverride()
          Statsig.removeLayerOverride()
        }}
      >
        Clear all gating overrides
      </GatingButton>
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
    <Flex row alignItems="center" gap="$spacing16" width="100%">
      <Flex flex={1} mr="$spacing8">
        <Text adjustsFontSizeToFit variant="body1" numberOfLines={isMobileApp ? 1 : undefined}>
          {name}
        </Text>
      </Flex>
      <Flex minWidth={52}>
        <Switch
          checked={status}
          variant="branded"
          onCheckedChange={(newValue: boolean): void => {
            Statsig.overrideGate(name, newValue)
          }}
        />
      </Flex>
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
