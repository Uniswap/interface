import { clearComplianceOverrides } from '@universe/compliance'
import { TRUSTED_CHROME_EXTENSION_IDS } from '@universe/environment'
import type { DynamicConfigKeys } from '@universe/gating'
import {
  DynamicConfigs,
  ExternallyConnectableExtensionConfigKey,
  FeatureFlags,
  getFeatureFlagName,
  getOverrideAdapter,
  Layers,
  NetworkRequestsConfigKey,
  useDynamicConfigValue,
  useFeatureFlagWithExposureLoggingDisabled,
} from '@universe/gating'
import type { PropsWithChildren, ReactNode } from 'react'
import { memo, useMemo, useState } from 'react'
import { Button, Flex, FlexProps, Input, ModalCloseIcon, styled, Switch, Text, TouchableArea } from 'ui/src'
import { Pin } from 'ui/src/components/icons/Pin'
import { ComplianceOverrides } from 'uniswap/src/components/gating/ComplianceOverrides'
import { useLayerValue } from 'uniswap/src/components/gating/Rows'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { FeatureFlagSelector } from '~/components/FeatureFlagModal/FeatureFlagSelector'
import { buildFlagGroups } from '~/components/FeatureFlagModal/flagGroups'
import { usePinnedExperiments, usePinnedFeatureFlags, usePinnedFlagGroups } from '~/dev/usePinnedFeatureFlags'
import { useModalState } from '~/hooks/useModalState'
import { useExternallyConnectableExtensionId } from '~/pages/ExtensionPasskeyAuthPopUp/useExternallyConnectableExtensionId'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const CenteredRowProps: FlexProps = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '$gap8',
  maxWidth: '100%',
  gap: '$gap4',
}

const CenteredRow = styled(Flex, CenteredRowProps)

const TouchableCenteredRow = styled(TouchableArea, CenteredRowProps)

const FlagInfo = styled(Flex, {
  flexShrink: 1,
})

function fuzzyMatch(query: string, ...targets: string[]): boolean {
  if (!query.trim()) {
    return true
  }
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const combined = targets.join(' ').toLowerCase()
  return words.every((word) => combined.includes(word))
}

interface GatingRowContentProps {
  title: string
  label?: string
  rightContent?: ReactNode
}

export function GatingRowContent({ title, label, rightContent }: GatingRowContentProps): JSX.Element {
  return (
    <CenteredRow flexGrow={1} flexShrink={1} py={rightContent ? '$none' : undefined}>
      <FlagInfo>
        <Text variant="body2" {...EllipsisTamaguiStyle}>
          {title}
        </Text>
        {label && (
          <Text variant="body4" color="$neutral2" {...EllipsisTamaguiStyle}>
            {label}
          </Text>
        )}
      </FlagInfo>
      {rightContent}
    </CenteredRow>
  )
}

export function GatingSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}): JSX.Element {
  return (
    <Flex
      onPressIn={(e: { stopPropagation: () => void }) => e.stopPropagation()}
      onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
    >
      <Switch checked={checked} onCheckedChange={onCheckedChange} variant="branded" />
    </Flex>
  )
}

type PinnableRowProps = GatingRowContentProps & {
  isPinned: boolean
  onPinPress: () => void
}

function PinnableRow({ isPinned, onPinPress, title, label, rightContent }: PinnableRowProps): JSX.Element {
  return (
    <TouchableCenteredRow group="item" onPress={onPinPress} gap="$gap8">
      <Flex
        alignSelf="center"
        p="$padding4"
        opacity={isPinned ? 1 : 0}
        $group-item-hover={{ opacity: isPinned ? 1 : 0.6 }}
      >
        <Pin size="$icon.16" color={isPinned ? '$accent1' : '$neutral2'} />
      </Flex>
      <GatingRowContent title={title} label={label} rightContent={rightContent} />
    </TouchableCenteredRow>
  )
}

interface FeatureFlagProps {
  label: string
  flag: FeatureFlags
}

const FeatureFlagGroup = memo(function FeatureFlagGroup({
  name,
  children,
}: PropsWithChildren<{ name: string }>): JSX.Element {
  const { isPinned, pinGroup, unpinGroup } = usePinnedFlagGroups()
  const pinned = isPinned(name)

  const onPinPress = useEvent(() => {
    if (pinned) {
      unpinGroup(name)
    } else {
      pinGroup(name)
    }
  })

  return (
    <>
      <TouchableCenteredRow key={name} group="item" onPress={onPinPress} justifyContent="flex-start" gap="$gap8">
        <Text variant="body1">{name}</Text>
        <Flex
          alignSelf="center"
          pl="$padding4"
          opacity={pinned ? 1 : 0}
          $group-item-hover={{ opacity: pinned ? 1 : 0.6 }}
        >
          <Pin size="$icon.16" color={pinned ? '$accent1' : '$neutral2'} />
        </Flex>
      </TouchableCenteredRow>
      {children}
    </>
  )
})

const FeatureFlagOption = memo(function FeatureFlagOption({ flag, label }: FeatureFlagProps): JSX.Element {
  const enabled = useFeatureFlagWithExposureLoggingDisabled(flag)
  const name = getFeatureFlagName(flag)
  const { isPinned, pinFlag, unpinFlag } = usePinnedFeatureFlags()
  const isOptionPinned = isPinned(name)

  // oxlint-disable-next-line no-shadow
  const onFlagVariantChange = useEvent((enabled: boolean) => {
    getOverrideAdapter().overrideGate(name, enabled)
  })

  const onPinPress = useEvent(() => {
    if (isOptionPinned) {
      unpinFlag(name)
    } else {
      pinFlag(name)
    }
  })

  return (
    <PinnableRow
      key={flag}
      isPinned={isOptionPinned}
      onPinPress={onPinPress}
      title={name}
      label={label}
      rightContent={
        <Flex
          onPressIn={(e: { stopPropagation: () => void }) => e.stopPropagation()}
          onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        >
          <Switch checked={enabled} onCheckedChange={onFlagVariantChange} variant="branded" />
        </Flex>
      }
    />
  )
})

interface LayerOptionProps {
  layerName: Layers
}
const LayerOption = memo(function LayerOption({ layerName }: LayerOptionProps): JSX.Element {
  const { value, overrideValue } = useLayerValue(layerName)
  const { isPinned, pinExperiment, unpinExperiment } = usePinnedExperiments()

  return (
    <>
      {Object.entries(value).map(([key, val]) => {
        return (
          typeof val === 'boolean' && (
            <PinnableRow
              key={key}
              isPinned={isPinned(key)}
              onPinPress={() => (isPinned(key) ? unpinExperiment(key) : pinExperiment(key))}
              title={key}
              label={undefined}
              rightContent={
                <GatingSwitch checked={val} onCheckedChange={(enabled) => overrideValue<boolean>({ [key]: enabled })} />
              }
            />
          )
        )
      })}
    </>
  )
})

const DynamicConfigDropdown = memo(function DynamicConfigDropdown<
  Conf extends Exclude<DynamicConfigs, DynamicConfigs.GasStrategies>,
  Key extends DynamicConfigKeys[Conf],
>({
  config,
  configKey,
  label,
  options,
  selected,
  parser,
}: {
  config: Conf
  configKey: Key
  label: string
  options: Array<string | number> | Record<string, string | number>
  selected: unknown[]
  parser: (opt: string) => unknown
}): JSX.Element {
  const onValueChange = useEvent((value: string) => {
    getOverrideAdapter().overrideDynamicConfig(config, {
      [configKey]: parser(value),
    })
  })

  const currentValue = String(selected[0] ?? '')

  return (
    <CenteredRow key={config}>
      <FlagInfo>
        <Text variant="body2">{config}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <FeatureFlagSelector id={config} value={currentValue} onValueChange={onValueChange} options={options} />
    </CenteredRow>
  )
})

export function FeatureFlagModal(): JSX.Element {
  const { isOpen, closeModal } = useModalState(ModalName.FeatureFlags)
  const externallyConnectableExtensionId = useExternallyConnectableExtensionId()
  const [searchQuery, setSearchQuery] = useState('')
  const { pinnedGroups } = usePinnedFlagGroups()

  const removeAllOverrides = useEvent(() => {
    getOverrideAdapter().removeAllOverrides()
    clearComplianceOverrides()
  })

  const handleReload = useEvent(() => {
    window.location.reload()
  })

  const isSearching = searchQuery.trim().length > 0

  const flagGroups = useMemo(
    () =>
      buildFlagGroups({
        extensionDropdown: (
          <DynamicConfigDropdown
            selected={[externallyConnectableExtensionId]}
            options={TRUSTED_CHROME_EXTENSION_IDS}
            parser={(id: string) => id}
            config={DynamicConfigs.ExternallyConnectableExtension}
            configKey={ExternallyConnectableExtensionConfigKey.ExtensionId}
            label="Which Extension the web app will communicate with"
          />
        ),
        networkRequestsConfig: <NetworkRequestsConfig />,
        layerOptions: (
          <Flex ml="$padding8" gap="$gap8">
            <FeatureFlagGroup name={Layers.SwapPage}>
              <LayerOption layerName={Layers.SwapPage} />
            </FeatureFlagGroup>
          </Flex>
        ),
        complianceOverrides: <ComplianceOverrides />,
      }),
    [externallyConnectableExtensionId],
  )

  return (
    <Modal name={ModalName.FeatureFlags} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex py="$gap20" px="$gap16" gap="$gap8">
        <CenteredRow borderBottomColor="$surface3" borderBottomWidth={1} borderRadius={0}>
          <Flex row grow alignItems="center" justifyContent="space-between">
            <Text variant="subheading2">Feature Flag Settings</Text>
            <Button onPress={removeAllOverrides} variant="branded" size="small" fill={false}>
              Clear Overrides
            </Button>
          </Flex>
          <ModalCloseIcon onClose={closeModal} />
        </CenteredRow>
        <Input
          autoFocus
          placeholder="Search flags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          width="100%"
          height={40}
          backgroundColor="$surface2"
          borderColor="$surface3"
          borderWidth={1}
          borderRadius="$rounded12"
          padding="$spacing12"
          color="$neutral1"
          placeholderTextColor="$neutral3"
          focusStyle={{ borderColor: '$accent1' }}
        />
        <Flex
          maxHeight="600px"
          pb="$gap8"
          $platform-web={{ overflowY: 'auto', overflowX: 'hidden' }}
          $md={{ maxHeight: 'unset' }}
        >
          {(() => {
            let hasResults = false

            const pinned = pinnedGroups
              .map((name) => flagGroups.find((g) => g.name === name))
              .filter((g): g is (typeof flagGroups)[number] => g !== undefined)
            const rest = flagGroups.filter((g) => !pinnedGroups.includes(g.name))
            const sortedFlagGroups = [...pinned, ...rest]

            const groups = sortedFlagGroups.map((group) => {
              const matchingFlags = isSearching
                ? group.flags.filter(({ flag, label }) => fuzzyMatch(searchQuery, getFeatureFlagName(flag), label))
                : group.flags
              const groupNameMatches = isSearching && fuzzyMatch(searchQuery, group.name)

              if (matchingFlags.length === 0 && !groupNameMatches) {
                // Groups with extra content (e.g. Network Requests, Layers) show when not searching,
                // but hide during search if their name doesn't match
                if (isSearching || !group.extra) {
                  return null
                }
              }

              hasResults = true

              // If specific flags match, show only those. If only the group name matches, show all flags in the group.
              const flagsToShow = matchingFlags.length > 0 ? matchingFlags : group.flags

              return (
                <FeatureFlagGroup key={group.name} name={group.name}>
                  {flagsToShow.map(({ flag, label }) => (
                    <FeatureFlagOption key={flag} flag={flag} label={label} />
                  ))}
                  {group.extra}
                </FeatureFlagGroup>
              )
            })

            return (
              <>
                {groups}
                {/* oxlint-disable-next-line typescript/no-unnecessary-condition */}
                {isSearching && !hasResults && (
                  <Text variant="body2" color="$neutral3" py="$gap16" textAlign="center">
                    No flags found
                  </Text>
                )}
              </>
            )
          })()}
        </Flex>
        <Button onPress={handleReload} variant="default" emphasis="secondary" size="small" fill={false}>
          Reload
        </Button>
      </Flex>
    </Modal>
  )
}

export default FeatureFlagModal

function NetworkRequestsConfig() {
  const currentValue = useDynamicConfigValue({
    config: DynamicConfigs.NetworkRequests,
    key: NetworkRequestsConfigKey.BalanceMaxRefetchAttempts,
    defaultValue: 30,
  })

  return (
    <DynamicConfigDropdown
      selected={[currentValue]}
      options={[1, 10, 20, 30]}
      parser={Number.parseInt}
      config={DynamicConfigs.NetworkRequests}
      configKey={NetworkRequestsConfigKey.BalanceMaxRefetchAttempts}
      label="Max refetch attempts"
    />
  )
}
