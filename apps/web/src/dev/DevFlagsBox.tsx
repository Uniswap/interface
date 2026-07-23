import { isBetaEnv, isDevEnv } from '@universe/environment'
import {
  getOverrideAdapter,
  getOverrides,
  LayerProperties,
  Layers,
  StatsigContext,
  useGateValue,
  useLayer,
} from '@universe/gating'
import { memo, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Flex, Separator, Switch, Text, TouchableArea, useShadowPropsShort } from 'ui/src'
import { Flag } from 'ui/src/components/icons/Flag'
import { Settings } from 'ui/src/components/icons/Settings'
import { X } from 'ui/src/components/icons/X'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAnalyticsDebugStore } from 'uniswap/src/features/telemetry/debug/useAnalyticsDebugStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { GatingRowContent, GatingSwitch } from '~/components/FeatureFlagModal/FeatureFlagModal'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { usePinnedExperiments, usePinnedFeatureFlags } from '~/dev/usePinnedFeatureFlags'
import { useModalState } from '~/hooks/useModalState'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const FLAG_BOX_MAX_WIDTH = 300

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

  const onCheckedChange = useEvent((value: boolean): void => {
    getOverrideAdapter().overrideGate(gateName, value)
  })

  return (
    <Flex
      key={gateName}
      row
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing8"
      py="$spacing4"
      onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}
    >
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
    <Flex onPress={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
      <GatingRowContent
        title={experimentName}
        label={layerName}
        rightContent={<GatingSwitch checked={checked} onCheckedChange={onCheckedChange} />}
      />
    </Flex>
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
  const { toggleModal: toggleFeatureFlagsModal } = useModalState(ModalName.FeatureFlags)

  const dispatch = useDispatch()

  const analyticsDebugEnabled = useAnalyticsDebugStore((s) => s.enabled)
  const toggleAnalyticsDebugger = useAnalyticsDebugStore((s) => s.actions.toggleEnabled)

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
      cursor="pointer"
      backgroundColor="$surface1"
      hoverStyle={{
        backgroundColor: '$surface1Hovered',
      }}
      testID={TestID.DevFlagsBox}
      onPress={() => {
        setIsOpen((prev) => !prev)
      }}
      maxWidth={FLAG_BOX_MAX_WIDTH}
    >
      {isOpen ? (
        <>
          <Flex row justifyContent="space-between" alignItems="center">
            <Text variant="subheading2">
              {isDevEnv() && 'Local Overrides'}
              {isBetaEnv() && 'Staging Overrides'}
            </Text>
            <MouseoverTooltip
              size={TooltipSize.Small}
              text="Protip: Set feature flags by adding '?featureFlagOverride={flag_name}' to the URL"
            >
              <Flex
                centered
                width={30}
                height={30}
                borderRadius="$rounded8"
                testID={TestID.DevFlagsSettingsToggle}
                hoverStyle={{
                  backgroundColor: '$surface1Hovered',
                }}
                onPress={(e) => {
                  e.stopPropagation()
                  toggleFeatureFlagsModal()
                }}
              >
                <Settings size="$icon.16" />
              </Flex>
            </MouseoverTooltip>
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
