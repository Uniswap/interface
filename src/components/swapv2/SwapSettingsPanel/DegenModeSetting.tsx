import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import React, { Dispatch, FC, SetStateAction } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import Toggle from 'components/Toggle'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager } from 'state/user/hooks'

type Props = {
  className?: string
  showConfirmation: boolean
  setShowConfirmation: Dispatch<SetStateAction<boolean>>
}
const DegenModeSetting: FC<Props> = ({ className, showConfirmation, setShowConfirmation }) => {
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()
  const { mixpanelHandler } = useMixpanel()

  const handleToggleDegenMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      mixpanelHandler(MIXPANEL_TYPE.DEGEN_MODE_TOGGLE, {
        type: 'off',
      })
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  const theme = useTheme()

  return (
    <>
      <Flex justifyContent="space-between" className={className}>
        <Flex width="fit-content" alignItems="center">
          <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
            <MouseoverTooltip
              text={
                <Trans>
                  Turn this on to make trades with very high price impact or to set very high slippage tolerance. This
                  can result in bad rates and loss of funds. Be cautious.
                </Trans>
              }
              placement="right"
            >
              <Trans>Degen Mode</Trans>
            </MouseoverTooltip>
          </TextDashed>
        </Flex>
        <Toggle id="toggle-expert-mode-button" isActive={isDegenMode} toggle={handleToggleDegenMode} />
      </Flex>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}

export default styled(DegenModeSetting)`
  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`
