import { isBetaEnv, isDevEnv } from '@universe/environment'
import {
  getOverrideAdapter,
  getOverrides,
  getUrlWithGateOverrides,
  LayerProperties,
  Layers,
  StatsigContext,
  useGateValue,
  useLayer,
} from '@universe/gating'
import { Button, Flex, Separator, Switch, Text, TouchableArea } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { CopySheets } from '@universe/mycelium/icons/CopySheets'
import { Flag } from '@universe/mycelium/icons/Flag'
import { X } from '@universe/mycelium/icons/X'
import { useShadowPropsShort } from '@universe/mycelium/theme-hooks-compat'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { TestID } from '@universe/test'
import { memo, useContext, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAnalyticsDebugStore } from 'uniswap/src/features/telemetry/debug/useAnalyticsDebugStore'
import { useEvent } from 'utilities/src/react/hooks'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { GatingRowContent, GatingSwitch } from '~/components/FeatureFlagModal/FeatureFlagModal'
import { useGatingUrlSync } from '~/dev/useGatingUrlSync'
import { usePinnedExperiments, usePinnedFeatureFlags } from '~/dev/usePinnedFeatureFlags'
import { useModalState } from '~/hooks/useModalState'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const FLAG_BOX_MAX_WIDTH = 300
const COPY_URL_TOOLTIP_MAX_WIDTH = 180

function findLayerForParam(paramKey: string): { layerName: Layers; experimentName: string } | null {
  for (const layerName of Object.values(Layers)) {
    if (LayerProperties[layerName].includes(paramKey)) {
      return { layerName: layerName as Layers, experimentName: paramKey }
    }
  }
  return null
}

const Override = (name: string, value: unknown) => {
  return (
    <Text key={name} variant="body3" color="$neutral2">
      {name}: {JSON.stringify(value)}
    </Text>
  )
}

const PinnedFlagRow = memo(function PinnedFlagRow({
  gateName,
  onUnpin,
}: {
  gateName: string
  onUnpin: () => void
}): JSX.Element {
  const checked = useGateValue(gateName, { disableExposureLog: true })
  const { overrideGate } = useGatingUrlSync()

  const onCheckedChange = useEvent((value: boolean): void => {
    overrideGate(gateName, value)
  })

  return (
    <Flex key={gateName} row alignItems="center" justifyContent="space-between" gap="$spacing8" py="$spacing4">
      <Text {...EllipsisTamaguiStyle}>{gateName}</Text>
      <Flex row alignItems="center" gap="$spacing4">
        <Switch checked={checked} onCheckedChange={onCheckedChange} variant="branded" />
        <TouchableArea hitSlop={8} onPress={onUnpin}>
          <X size="$icon.16" color="$neutral2" hoverColor="$neutral1" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
})

const PinnedExperimentRow = memo(function PinnedExperimentRow({
  layerName,
  experimentName,
}: {
  layerName: Layers
  experimentName: string
}): JSX.Element {
  const { get: getLayerValue } = useLayer(layerName)
  const keys = LayerProperties[layerName]
  const value = keys.reduce<Record<string, unknown>>((acc, key) => ({ ...acc, [key]: getLayerValue(key) ?? false }), {})
  const checked = Boolean(value[experimentName])
  const onCheckedChange = useEvent((newValue: boolean): void => {
    getOverrideAdapter().overrideLayer(layerName, { ...value, [experimentName]: newValue })
  })

  return (
    <GatingRowContent
      title={experimentName}
      label={layerName}
      rightContent={<GatingSwitch checked={checked} onCheckedChange={onCheckedChange} />}
    />
  )
})

export function DevFlagsBox() {
  const { client: statsigClient } = useContext(StatsigContext)
  const latest = getOverrides(statsigClient)
  const [displayOverrides, setDisplayOverrides] = useState(latest)

  // When Statsig refreshes after a toggle, getOverrides briefly returns empty. Keep showing the last
  // non-empty list until we get a new one so the list doesn't flash.
  useEffect(() => {
    const next = getOverrides(statsigClient)
    const hasAny = next.gateOverrides.length > 0 || next.configOverrides.length > 0
    if (hasAny) {
      setDisplayOverrides({
        gateOverrides: next.gateOverrides,
        configOverrides: next.configOverrides,
      })
    }
  }, [statsigClient, statsigClient.loadingStatus])

  const { gateOverrides, configOverrides } = displayOverrides
  const { pinnedFlags, unpinFlag } = usePinnedFeatureFlags()
  const { pinnedExperiments } = usePinnedExperiments()
  const shadowProps = useShadowPropsShort()

  const allOverrides = [...gateOverrides, ...configOverrides]

  const overrides = allOverrides
    .filter(([name]) => !pinnedFlags.includes(name))
    .map(([name, value]) => Override(name, value))

  const hasFilteredOverrides = overrides.length > 0
  const hasPinnedFlags = pinnedFlags.length > 0
  const hasPinnedExperiments = pinnedExperiments.length > 0

  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { isOpen: isFeatureFlagsModalOpen, toggleModal: toggleFeatureFlagsModal } = useModalState(
    ModalName.FeatureFlags,
  )

  const openPanel = useEvent((): void => {
    setIsOpen(true)
  })

  const collapsePanel = useEvent((): void => {
    setIsOpen(false)
  })

  // The feature flags modal is portaled outside the panel, so clicks in it must not count as outside.
  useOnClickOutside({ node: panelRef, handler: isOpen && !isFeatureFlagsModalOpen ? collapsePanel : undefined })

  const dispatch = useDispatch()

  const analyticsDebugEnabled = useAnalyticsDebugStore((s) => s.enabled)
  const toggleAnalyticsDebugger = useAnalyticsDebugStore((s) => s.actions.toggleEnabled)

  const [isUrlCopied, copyToClipboard] = useCopyClipboard(ONE_SECOND_MS)
  const onPressCopyUrl = useEvent((): void => {
    copyToClipboard(getUrlWithGateOverrides()).catch(() => undefined)
  })

  const onPressReset = (): void => {
    dispatch(resetUniswapBehaviorHistory())
  }

  return (
    <Flex
      $platform-web={{
        position: 'fixed',
        ...shadowProps,
      }}
      $xl={{
        bottom: 30,
      }}
      bottom="$spacing48"
      left="$spacing20"
      zIndex="$modal"
      padding={10}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded8"
      cursor={isOpen ? 'auto' : 'pointer'}
      backgroundColor="$surface1"
      ref={panelRef}
      testID={TestID.DevFlagsBox}
      onPress={isOpen ? undefined : openPanel}
      maxWidth={FLAG_BOX_MAX_WIDTH}
    >
      {isOpen ? (
        <>
          <Flex row justifyContent="space-between" alignItems="center">
            <Text variant="subheading2">
              {isDevEnv() && 'Local Overrides'}
              {isBetaEnv() && 'Staging Overrides'}
            </Text>
            <TouchableArea
              tag="button"
              aria-label="Close dev tools"
              centered
              width={30}
              height={30}
              borderRadius="$rounded8"
              cursor="pointer"
              testID={TestID.DevFlagsClose}
              hoverStyle={{
                backgroundColor: '$surface1Hovered',
              }}
              onPress={collapsePanel}
            >
              <X size="$icon.16" />
            </TouchableArea>
          </Flex>
          {hasFilteredOverrides && overrides}
          {allOverrides.length === 0 && (
            <Text variant="body3" color="$neutral2">
              No overrides
            </Text>
          )}
          {hasPinnedFlags && (
            <Flex gap="$spacing4" mt="$spacing8" flexDirection="column">
              {pinnedFlags.map((gateName) => (
                <PinnedFlagRow key={gateName} gateName={gateName} onUnpin={() => unpinFlag(gateName)} />
              ))}
            </Flex>
          )}
          {hasPinnedExperiments && (
            <Flex gap="$spacing4" mt="$spacing8" flexDirection="column">
              {pinnedExperiments
                .map((key) => findLayerForParam(key))
                .filter((resolved): resolved is { layerName: Layers; experimentName: string } => resolved !== null)
                .map(({ layerName, experimentName }) => (
                  <PinnedExperimentRow
                    key={`${layerName}:${experimentName}`}
                    layerName={layerName}
                    experimentName={experimentName}
                  />
                ))}
            </Flex>
          )}

          <Flex row>
            <Button
              variant="default"
              emphasis="primary"
              size="xsmall"
              mt="$spacing8"
              testID={TestID.DevFlagsFeatureFlagsButton}
              onPress={toggleFeatureFlagsModal}
            >
              Feature flags
            </Button>
          </Flex>
          <Flex row>
            <Tooltip placement="right" delay={{ open: 500, close: 0 }}>
              <Tooltip.Trigger row flex={1}>
                <Button
                  variant="default"
                  emphasis="tertiary"
                  size="xsmall"
                  mt="$spacing8"
                  icon={isUrlCopied ? <Check size="$icon.16" color="$statusSuccess" /> : <CopySheets size="$icon.16" />}
                  testID={TestID.DevFlagsCopyUrlButton}
                  onPress={onPressCopyUrl}
                >
                  {isUrlCopied ? 'Copied' : 'Copy URL'}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content maxWidth={COPY_URL_TOOLTIP_MAX_WIDTH}>
                <Text variant="body4">Copy current URL with all active feature flags</Text>
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip>
          </Flex>

          <Separator my="$spacing16" />

          <Text variant="subheading2">Dev Tools</Text>

          <Flex row>
            <Button emphasis="secondary" size="xsmall" onPress={onPressReset} mt="$spacing8">
              Reset behavior history
            </Button>
          </Flex>
          <Flex row>
            <Button emphasis="secondary" size="xsmall" onPress={toggleAnalyticsDebugger} mt="$spacing8">
              {analyticsDebugEnabled ? 'Disable Analytics Debugger' : 'Enable Analytics Debugger'}
            </Button>
          </Flex>
        </>
      ) : (
        <Flag size="$icon.16" />
      )}
    </Flex>
  )
}

export default DevFlagsBox
