import { getOverrides, StatsigContext } from '@universe/gating'
import { RowBetween } from 'components/deprecated/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useModalState } from 'hooks/useModalState'
import { useContext, useState } from 'react'
import { Flag, Settings } from 'react-feather'
import { useDispatch } from 'react-redux'
import { ThemedText } from 'theme/components'
import { Button, Flex, useShadowPropsShort } from 'ui/src'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

const Override = (name: string, value: any) => {
  return (
    <ThemedText.LabelSmall key={name}>
      {name}: {JSON.stringify(value)}
    </ThemedText.LabelSmall>
  )
}

export default function DevFlagsBox() {
  const { client: statsigClient } = useContext(StatsigContext)
  const { gateOverrides, configOverrides } = getOverrides(statsigClient)
  const shadowProps = useShadowPropsShort()

  const overrides = [...gateOverrides, ...configOverrides].map(([name, value]) => Override(name, value))

  const hasOverrides = overrides.length > 0

  const [isOpen, setIsOpen] = useState(false)
  const { toggleModal: toggleFeatureFlagsModal } = useModalState(ModalName.FeatureFlags)

  const dispatch = useDispatch()

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
      borderWidth={1}
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
    >
      {isOpen ? (
        <RowBetween>
          <ThemedText.SubHeader>
            {isDevEnv() && 'Local Overrides'}
            {isBetaEnv() && 'Staging Overrides'}
          </ThemedText.SubHeader>
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
              <Settings width={15} height={15} />
            </Flex>
          </MouseoverTooltip>
        </RowBetween>
      ) : (
        <Flag />
      )}

      {isOpen && (hasOverrides ? overrides : <ThemedText.LabelSmall>No overrides</ThemedText.LabelSmall>)}
      {isOpen && (
        <Button variant="branded" emphasis="secondary" size="small" onPress={onPressReset} mt="$spacing8">
          Reset behavior history
        </Button>
      )}
    </Flex>
  )
}
