import { clearComplianceOverrides } from '@universe/compliance'
import { isExtensionApp, isMobileApp } from '@universe/environment'
import {
  DynamicConfigs,
  EmbeddedWalletConfigKey,
  ExperimentPropertyNames,
  Experiments,
  ExtensionBiometricUnlockConfigKey,
  FeatureFlags,
  ForceUpgradeConfigKey,
  getFeatureFlagName,
  getOverrideAdapter,
  LayerProperties,
  Layers,
  useDynamicConfigValue,
  useFeatureFlagWithExposureLoggingDisabled,
  WALLET_FEATURE_FLAG_NAMES,
} from '@universe/gating'
import { Flex, Text, Switch, Separator } from '@universe/mycelium'
import { Accordion } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import React, { memo, PropsWithChildren, useCallback, useDeferredValue, useState } from 'react'
import { ComplianceOverrides } from 'uniswap/src/components/gating/ComplianceOverrides'
import {
  DynamicConfigDropdown,
  DynamicConfigDropdownBoolean,
} from 'uniswap/src/components/gating/DynamicConfigDropdown'
import {
  EMBEDDED_WALLET_BASE_URL_OPTIONS,
  FORCE_UPGRADE_STATUS_OPTIONS,
  FORCE_UPGRADE_TRANSLATIONS_OPTIONS,
} from 'uniswap/src/components/gating/dynamicConfigOverrides'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { ExperimentRow, LayerRow } from 'uniswap/src/components/gating/Rows'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useForceUpgradeStatus } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeStatus'
import { useForceUpgradeTranslations } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeTranslations'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { matchesAllWords } from 'utilities/src/primitives/string'
import { useEvent } from 'utilities/src/react/hooks'

const SORTED_WALLET_FLAGS = Array.from(WALLET_FEATURE_FLAG_NAMES.entries()).sort(([, nameA], [, nameB]) =>
  nameA.localeCompare(nameB),
)
const ALL_EXPERIMENTS = Object.values(Experiments)
const ALL_LAYERS = Object.values(Layers)

function renderFeatureFlagRow([flag, flagName]: [FeatureFlags, string]): JSX.Element {
  return <FeatureFlagRow key={flagName} flag={flag} />
}

function renderExperimentRow(experiment: Experiments): JSX.Element {
  return (
    <Flex key={experiment} gap="$gap8">
      <Separator />
      <ExperimentRow value={experiment} />
    </Flex>
  )
}

function renderLayerRow(layer: Layers): JSX.Element {
  return (
    <Flex key={layer} gap="$gap8">
      <Separator />
      <LayerRow value={layer} />
    </Flex>
  )
}

export function GatingOverrides(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  // Filtering mounts/unmounts dozens of rows; deferring it keeps the controlled input responsive.
  const deferredQuery = useDeferredValue(searchQuery)
  const isSearching = deferredQuery.trim().length > 0

  const featureFlagRows = SORTED_WALLET_FLAGS.map(renderFeatureFlagRow)
  const experimentRows = ALL_EXPERIMENTS.map(renderExperimentRow)
  const layerRows = ALL_LAYERS.map(renderLayerRow)

  const matchingFeatureFlagRows = isSearching
    ? SORTED_WALLET_FLAGS.filter(([, flagName]) => matchesAllWords(deferredQuery, flagName)).map(renderFeatureFlagRow)
    : []
  const matchingExperimentRows = isSearching
    ? ALL_EXPERIMENTS.filter((experiment) =>
        matchesAllWords(deferredQuery, experiment, ...ExperimentPropertyNames[experiment]),
      ).map(renderExperimentRow)
    : []
  const matchingLayerRows = isSearching
    ? ALL_LAYERS.filter((layer) => matchesAllWords(deferredQuery, layer, ...LayerProperties[layer])).map(renderLayerRow)
    : []

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
    clearComplianceOverrides()
  })

  const embeddedWalletBaseUrl = useDynamicConfigValue({
    config: DynamicConfigs.EmbeddedWalletConfig,
    key: EmbeddedWalletConfigKey.BaseUrl,
    defaultValue: UNISWAP_WEB_URL,
  })
  const forceUpgradeStatus = useForceUpgradeStatus()
  const forceUpgradeTranslations = useForceUpgradeTranslations()

  const searchInput = (
    <SearchTextInput
      placeholder="Search flags, experiments, layers"
      py="$spacing8"
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
  )

  const hasResults =
    matchingFeatureFlagRows.length > 0 || matchingExperimentRows.length > 0 || matchingLayerRows.length > 0
  // Accordion sections start collapsed, so results are listed flat instead of inside them.
  const searchResults = (
    <Flex gap="$spacing12" mt="$spacing12">
      <SearchResultsSection title="⛳️ Feature Flags">{matchingFeatureFlagRows}</SearchResultsSection>
      <SearchResultsSection title="🔬 Experiments">{matchingExperimentRows}</SearchResultsSection>
      <SearchResultsSection title="💇 Layers">{matchingLayerRows}</SearchResultsSection>
      {!hasResults && (
        <Text variant="body2" color="$neutral3" py="$spacing16" textAlign="center">
          No results
        </Text>
      )}
    </Flex>
  )

  // The accordion stays mounted (just hidden) while searching, so clearing the search doesn't rebuild an open
  // section's rows. searchInput must keep its tree position, or it remounts and drops focus on each keystroke.
  return (
    <>
      {searchInput}
      {isSearching && searchResults}
      <Flex flexDirection="column" display={isSearching ? 'none' : 'flex'}>
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

            <Flex mt="$spacing12" gap="$spacing12">
              <DynamicConfigGroup title="Biometric Unlock" hidden={!isExtensionApp}>
                <DynamicConfigDropdownBoolean
                  config={DynamicConfigs.ExtensionBiometricUnlock}
                  configKey={ExtensionBiometricUnlockConfigKey.EnableUnlocking}
                  label="Unlocking"
                />

                <DynamicConfigDropdownBoolean
                  config={DynamicConfigs.ExtensionBiometricUnlock}
                  configKey={ExtensionBiometricUnlockConfigKey.EnableOnboardingEnrollment}
                  label="Onboarding Enrollment"
                />

                <DynamicConfigDropdownBoolean
                  config={DynamicConfigs.ExtensionBiometricUnlock}
                  configKey={ExtensionBiometricUnlockConfigKey.EnableSettingsEnrollment}
                  label="Settings Enrollment"
                />
              </DynamicConfigGroup>

              <DynamicConfigGroup title="Embedded Wallet">
                <DynamicConfigDropdown
                  config={DynamicConfigs.EmbeddedWalletConfig}
                  configKey={EmbeddedWalletConfigKey.BaseUrl}
                  label="Base URL"
                  options={EMBEDDED_WALLET_BASE_URL_OPTIONS}
                  selected={embeddedWalletBaseUrl}
                />
              </DynamicConfigGroup>

              <DynamicConfigGroup title="Force/Soft Upgrade">
                <DynamicConfigDropdown
                  config={DynamicConfigs.ForceUpgrade}
                  configKey={ForceUpgradeConfigKey.Status}
                  label="Status"
                  options={FORCE_UPGRADE_STATUS_OPTIONS}
                  selected={forceUpgradeStatus}
                />

                <DynamicConfigDropdown
                  config={DynamicConfigs.ForceUpgrade}
                  configKey={ForceUpgradeConfigKey.Translations}
                  label="Translations"
                  options={FORCE_UPGRADE_TRANSLATIONS_OPTIONS}
                  selected={JSON.stringify(forceUpgradeTranslations)}
                />
              </DynamicConfigGroup>
            </Flex>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="compliance">
          <AccordionHeader title="🌍 Compliance / Geo" />

          <Accordion.Content>
            <Flex gap="$spacing12" mt="$spacing12">
              <ComplianceOverrides />
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

export function AccordionHeader({ title, testId }: { title: React.ReactNode; testId?: string }): JSX.Element {
  return (
    <Accordion.Header mt="$spacing12" testID={testId}>
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

const FeatureFlagRow = memo(function FeatureFlagRow({ flag }: { flag: FeatureFlags }): JSX.Element {
  const status = useFeatureFlagWithExposureLoggingDisabled(flag)
  const name = getFeatureFlagName(flag)
  const onCheckedChange = useCallback(
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
        <Switch checked={status} variant="branded" onCheckedChange={onCheckedChange} />
      </Flex>
    </Flex>
  )
})

function SearchResultsSection({ title, children }: { title: string; children: JSX.Element[] }): JSX.Element | null {
  if (children.length === 0) {
    return null
  }
  return (
    <Flex gap="$spacing12">
      <Text variant="subheading1">{title}</Text>
      {children}
    </Flex>
  )
}

function DynamicConfigGroup({
  title,
  hidden = false,
  children,
}: PropsWithChildren<{
  title: string
  hidden?: boolean
}>): JSX.Element | null {
  return hidden ? null : (
    <Flex flexDirection="column" backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing12">
      <Text variant="subheading1">{title}</Text>
      {children}
    </Flex>
  )
}
