import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { ColumnCenter } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { useState } from 'react'
import { Flag, Settings } from 'react-feather'
import { useDispatch } from 'react-redux'
import { useCloseModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { Button } from 'ui/src'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

const Box = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: ${({ theme }) => theme.surface1};
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);
  user-select: none;
  z-index: ${Z_INDEX.fixed};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    bottom: 70px;
  }
`
const Override = (name: string, value: any) => {
  return (
    <ThemedText.LabelSmall key={name}>
      {name}: {JSON.stringify(value)}
    </ThemedText.LabelSmall>
  )
}

const SettingsContainer = styled(ColumnCenter)`
  width: 30px;
  height: 30px;
  justify-content: center;
  border-radius: 12px;
  :hover {
    background: ${({ theme }) => theme.surface2};
  }
`

export default function DevFlagsBox() {
  const statsigOverrides = Statsig.initializeCalled()
    ? Statsig.getAllOverrides()
    : { gates: {}, configs: {}, layers: {} }
  const configOverrides = Object.entries(statsigOverrides.configs)
  const gateOverrides = Object.entries(statsigOverrides.gates)

  const overrides = [...gateOverrides, ...configOverrides].map(([name, value]) => Override(name, value))

  const hasOverrides = overrides.some((g) => g !== null)

  const [isOpen, setIsOpen] = useState(false)
  const toggleOpen = () => setIsOpen((open) => !open)
  const toggleFeatureFlagsModal = useToggleModal(ApplicationModal.FEATURE_FLAGS)
  const closeFeatureFlagsModal = useCloseModal()

  const dispatch = useDispatch()

  const onPressReset = (): void => {
    dispatch(resetUniswapBehaviorHistory())
  }

  return (
    <Box
      onClick={() => {
        toggleOpen()
        closeFeatureFlagsModal()
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
            <SettingsContainer
              onClick={(e) => {
                e.stopPropagation()
                toggleFeatureFlagsModal()
              }}
            >
              <Settings width={15} height={15} />
            </SettingsContainer>
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
    </Box>
  )
}
