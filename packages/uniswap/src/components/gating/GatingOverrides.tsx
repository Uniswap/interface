import React, { useCallback } from 'react'
import { Accordion, Flex, Separator, Switch, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { DynamicConfigDropdown } from 'uniswap/src/components/gating/DynamicConfigDropdown'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { ExperimentRow, LayerRow } from 'uniswap/src/components/gating/Rows'
import {
  EMBEDDED_WALLET_BASE_URL_OPTIONS,
  FORCE_UPGRADE_STATUS_OPTIONS,
  FORCE_UPGRADE_TRANSLATIONS_OPTIONS,
} from 'uniswap/src/components/gating/dynamicConfigOverrides'
import { useForceUpgradeStatus } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeStatus'
import { useForceUpgradeTranslations } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeTranslations'
import { DynamicConfigs, EmbeddedWalletConfigKey, ForceUpgradeConfigKey } from 'uniswap/src/features/gating/configs'
import { Experiments, Layers } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, WALLET_FEATURE_FLAG_NAMES, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { getOverrideAdapter } from 'uniswap/src/features/gating/sdk/statsig'
import { useEmbeddedWalletBaseUrl } from 'uniswap/src/features/passkey/hooks/useEmbeddedWalletBaseUrl'
import { isMobileApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

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
    experimentRows.push(
      <Flex key={experiment} gap="$gap8">
        <Separator />
        <ExperimentRow key={experiment} value={experiment} />
      </Flex>,
    )
  }

  const layerRows: JSX.Element[] = []
  for (const layer of Object.values(Layers)) {
    layerRows.push(
      <Flex key={layer} gap="$gap8">
        <Separator />
        <LayerRow key={layer} value={layer} />
      </Flex>,
    )
  }

  const onClearAllLocalFeatureGateOverrides = useEvent(() => {
    WALLET_FEATURE_FLAG_NAMES.forEach((flag) => {
      getOverrideAdapter().removeGateOverride(flag)
    })
  })

  const onClearAllLocalExperimentConfigOverrides = useEvent(() => {
    const experiments = Object.keys(Experiments)
    experiments.forEach((experiment) => {
      getOverrideAdapter().removeExperimentOverride(experiment)
    })
  })

  const onClearAllLocalLayerConfigOverrides = useEvent(() => {
    const layers = Object.values(Layers)
    layers.forEach((layer) => {
      getOverrideAdapter().removeLayerOverride(layer)
    })
  })

  const onClearAllLocalDynamicConfigOverrides = useEvent(() => {
    const dynamicConfigs = Object.values(DynamicConfigs)
    dynamicConfigs.forEach((config) => {
      getOverrideAdapter().removeDynamicConfigOverride(config)
    })
  })

  const onClearAllGatingOverrides = useEvent(() => {
    getOverrideAdapter().removeAllOverrides()
  })

  return (
    <>
      <Text variant="heading3">Gating</Text>
      <Flex flexDirection="column">
        <Accordion.Item value="feature-flags">
          <AccordionHeader title="⛳️ Feature Flags" />

          <Accordion.Content>
            <GatingButton onPress={onClearAllLocalFeatureGateOverrides}>
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
            <GatingButton onPress={onClearAllLocalExperimentConfigOverrides}>
              Clear all local experiment/config overrides
            </GatingButton>

            <Flex gap="$spacing12" mt="$spacing12">
              {experimentRows}
            </Flex>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="layers">
          <AccordionHeader title=" 💇 Layers" />

          <Accordion.Content>
            <GatingButton onPress={onClearAllLocalLayerConfigOverrides}>
              Clear all local layer/config overrides
            </GatingButton>

            <Flex gap="$spacing12" mt="$spacing12">
              {layerRows}
            </Flex>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="dynamic-configs">
          <AccordionHeader title="🕺 Dynamic Configs" />

          <Accordion.Content>
            <GatingButton onPress={onClearAllLocalDynamicConfigOverrides}>
              Clear all local dynamic config overrides
            </GatingButton>

            <Flex gap="$spacing12" mt="$spacing12">
              <DynamicConfigDropdown
                config={DynamicConfigs.EmbeddedWallet}
                configKey={EmbeddedWalletConfigKey.BaseUrl}
                label="Embedded Wallet Base URL"
                options={EMBEDDED_WALLET_BASE_URL_OPTIONS}
                selected={useEmbeddedWalletBaseUrl()}
              />

              <DynamicConfigDropdown
                config={DynamicConfigs.ForceUpgrade}
                configKey={ForceUpgradeConfigKey.Status}
                label="Force Upgrade Status"
                options={FORCE_UPGRADE_STATUS_OPTIONS}
                selected={useForceUpgradeStatus()}
              />

              <DynamicConfigDropdown
                config={DynamicConfigs.ForceUpgrade}
                configKey={ForceUpgradeConfigKey.Translations}
                label="Force Upgrade Translations"
                options={FORCE_UPGRADE_TRANSLATIONS_OPTIONS}
                selected={JSON.stringify(useForceUpgradeTranslations())}
              />
            </Flex>
          </Accordion.Content>
        </Accordion.Item>
      </Flex>

      <GatingButton mt="$spacing12" onPress={onClearAllGatingOverrides}>
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
  const onChackedChange = useCallback(
    (newValue: boolean): void => {
      getOverrideAdapter().overrideGate(name, newValue)
    },
    [name],
  )

  return (
    <Flex row alignItems="center" gap="$spacing16" width="100%">
      <Flex flex={1} mr="$spacing8">
        <Text adjustsFontSizeToFit variant="body1" numberOfLines={isMobileApp ? 1 : undefined}>
          {name}
        </Text>
      </Flex>
      <Flex minWidth={52}>
        <Switch checked={status} variant="branded" onCheckedChange={onChackedChange} />
      </Flex>
    </Flex>
  )
}
