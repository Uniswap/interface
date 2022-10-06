import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { config } from 'src/config'
import { useCheckForceUpgradeQuery } from 'src/features/forceUpgrade/forceUpgradeApi'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { ModalName } from 'src/features/telemetry/constants'
import { openUri } from 'src/utils/linking'

export function ForceUpgradeModal() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  const { data: upgradeStatus } = useCheckForceUpgradeQuery()

  useEffect(() => {
    if (upgradeStatus !== UpgradeStatus.NotRequired) {
      setIsVisible(true)
    }
  }, [upgradeStatus])

  const onPressConfirm = () => {
    /**
     * TODO(MOB-2764): Replace with actual app link once available
     * App store link format example: 'itms-apps://apps.apple.com/tr/app/uniswap/id1055437768?l=tr'
     */
    const link = config.uniswapAppUrl
    openUri(link, true)
  }

  const onClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <WarningModal
      confirmText={t('Update app')}
      hideHandlebar={upgradeStatus === UpgradeStatus.Required}
      isDismissible={upgradeStatus !== UpgradeStatus.Required}
      isVisible={isVisible}
      modalName={ModalName.ForceUpgradeModal}
      severity={WarningSeverity.High}
      title={t('Update the app to continue')}
      onClose={onClose}
      onConfirm={onPressConfirm}>
      <Text color="textSecondary" textAlign="center" variant="bodySmall">
        {t(
          'The version of Uniswap Wallet you’re using is out of date and is missing critical upgrades. If you don’t update the app or you don’t have your recovery phrase written down, you won’t be able to access your assets.'
        )}
      </Text>
    </WarningModal>
  )
}
