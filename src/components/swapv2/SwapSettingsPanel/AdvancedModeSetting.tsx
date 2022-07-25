import React, { useState } from 'react'
import { Flex } from 'rebass'
import { Trans, t } from '@lingui/macro'

import QuestionHelper from 'components/QuestionHelper'
import Toggle from 'components/Toggle'
import { useExpertModeManager } from 'state/user/hooks'
import AdvanceModeModal from 'components/TransactionSettings/AdvanceModeModal'

const AdvancedModeSetting = () => {
  const [expertMode, toggleExpertMode] = useExpertModeManager()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleToggleAdvancedMode = () => {
    if (expertMode /* is already ON */) {
      toggleExpertMode()
      setShowConfirmation(false)
      return
    }

    // need confirmation before turning it on
    setShowConfirmation(true)
  }

  return (
    <>
      <Flex justifyContent="space-between">
        <Flex width="fit-content" alignItems="center">
          <span className="settingLabel">
            <Trans>Advanced Mode</Trans>
          </span>
          <QuestionHelper text={t`Enables high slippage trades. Use at your own risk`} />
        </Flex>
        <Toggle id="toggle-expert-mode-button" isActive={expertMode} toggle={handleToggleAdvancedMode} />
      </Flex>

      <AdvanceModeModal show={showConfirmation} setShow={setShowConfirmation} />
    </>
  )
}

export default AdvancedModeSetting
