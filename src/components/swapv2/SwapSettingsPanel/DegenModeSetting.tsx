import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { FC, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import Toggle from 'components/Toggle'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'
import SettingLabel from 'components/swapv2/SwapSettingsPanel/SettingLabel'
import { useDegenModeManager } from 'state/user/hooks'

type Props = {
  className?: string
}
const DegenModeSetting: FC<Props> = ({ className }) => {
  const [isDegenMode, toggleDegenMode] = useDegenModeManager()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleToggleAdvancedMode = () => {
    if (isDegenMode /* is already ON */) {
      toggleDegenMode()
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  return (
    <>
      <Flex justifyContent="space-between" className={className}>
        <Flex width="fit-content" alignItems="center">
          <SettingLabel>
            <Trans>Advanced Mode</Trans>
          </SettingLabel>
          <InfoHelper
            placement="top"
            text={
              <Trans>
                You can make trades with price impact which is <b>very</b> high, or cannot be calculated. Enable at your
                own risk
              </Trans>
            }
          />
        </Flex>
        <Toggle id="toggle-expert-mode-button" isActive={isDegenMode} toggle={handleToggleAdvancedMode} />
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
