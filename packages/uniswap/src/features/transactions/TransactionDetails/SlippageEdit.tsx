import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Popover } from 'ui/src'

import { TransactionSettingsModal } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/TransactionSettingsModal/TransactionSettingsModal'
import { SlippageUpdate } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/SlippageUpdate/SlippageUpdate'
import { isInterface } from 'utilities/src/platform'

export function SlippageEdit({
  onWalletSlippageEditPress: onSlippageEditPress,
}: {
  onWalletSlippageEditPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [showInterfaceSlippageSettings, setShowInterfaceSlippageSettings] = useState(false)
  const editButton = (
    <Button
      size="xxsmall"
      emphasis="secondary"
      fill={false}
      onPress={() => (isInterface ? setShowInterfaceSlippageSettings(true) : onSlippageEditPress?.())}
    >
      {t('common.button.edit')}
    </Button>
  )

  if (!isInterface) {
    return editButton
  }

  // Web needs to use a popover, so we need to wrap both the button and the modal in a popover
  return (
    <Popover
      placement="bottom-end"
      open={showInterfaceSlippageSettings}
      onOpenChange={(open: boolean) => {
        if (!open && isInterface) {
          setShowInterfaceSlippageSettings(false)
        }
      }}
    >
      <Popover.Trigger asChild>{editButton}</Popover.Trigger>
      <TransactionSettingsModal
        settings={[SlippageUpdate]}
        initialSelectedSetting={SlippageUpdate}
        isOpen={showInterfaceSlippageSettings}
        onClose={() => setShowInterfaceSlippageSettings(false)}
      />
    </Popover>
  )
}
