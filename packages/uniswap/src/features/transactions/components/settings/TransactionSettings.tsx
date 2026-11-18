import { isMobileApp, isWebApp } from '@universe/environment'
import type { FlexProps } from '@universe/mycelium'
import { Flex } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { SettingsTrigger, type SettingsTriggerProps } from '@universe/transactions-ui'
import type { ReactNode } from 'react'
import { Popover } from 'ui/src'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { TransactionSettingsModalId } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import {
  useModalHide,
  useModalShow,
  useModalVisibility,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/useTransactionSettingsModalStore'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { ViewOnlyButton } from 'uniswap/src/features/transactions/components/settings/ViewOnlyButton'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useEvent } from 'utilities/src/react/hooks'

/** What TransactionSettings hands its trigger: the press that opens and closes the settings, and the test id. */
export type TransactionSettingsTriggerProps = Required<Pick<SettingsTriggerProps, 'onPress' | 'testID'>>

export interface TransactionSettingsProps {
  settings: TransactionSettingConfig[]
  adjustTopAlignment?: boolean
  adjustRightAlignment?: boolean
  position?: FlexProps['position']
  defaultTitle?: string
  testID?: string
  /** Renders the settings gear, e.g. TransactionSettingsButtonWithSlippage. Defaults to the plain gear. */
  renderTrigger?: (triggerProps: TransactionSettingsTriggerProps) => ReactNode
  onClose?: () => void
}

export function TransactionSettings({
  settings,
  adjustTopAlignment = true,
  adjustRightAlignment = true,
  position = 'absolute',
  defaultTitle,
  renderTrigger,
  testID,
  onClose,
}: TransactionSettingsProps): JSX.Element {
  const account = useWallet().evmAccount

  const isTransactionSettingsModalVisible = useModalVisibility(TransactionSettingsModalId.TransactionSettings)
  const handleShowTransactionSettingsModal = useModalShow(TransactionSettingsModalId.TransactionSettings)
  const handleHideTransactionSettingsModal = useModalHide(TransactionSettingsModalId.TransactionSettings)
  const isViewOnlyModalVisible = useModalVisibility(TransactionSettingsModalId.ViewOnly)
  const handleShowViewOnlyModal = useModalShow(TransactionSettingsModalId.ViewOnly)
  const handleHideViewOnlyModal = useModalHide(TransactionSettingsModalId.ViewOnly)

  const onCloseSettingsModal = useEvent((): void => {
    if (onClose) {
      onClose()
    } else {
      handleHideTransactionSettingsModal()
    }
  })

  const onPopoverOpenChange = useEvent((open: boolean): void => {
    // Only close on interface because SwapSettings are rendered in a modal on mobile/extension
    // and when click is triggered inside extension Modal it causes onOpenChange to trigger
    if (!open && isWebApp) {
      onCloseSettingsModal()
    }
  })

  const onPressTransactionSettings = useEvent((): void => {
    if (isTransactionSettingsModalVisible) {
      onCloseSettingsModal()
    } else {
      handleShowTransactionSettingsModal()
    }

    dismissNativeKeyboard()
  })

  const isViewOnlyWallet = account?.accountType === AccountType.Readonly

  const topAlignment = adjustTopAlignment ? (isWebApp ? -38 : 6) : 0
  const rightAlignment = adjustRightAlignment ? (isMobileApp ? 24 : 4) : 0
  const popoverOffset = isWebApp
    ? { crossAxis: adjustRightAlignment ? 0 : 8, mainAxis: adjustTopAlignment ? 0 : 8 }
    : undefined

  const triggerProps: TransactionSettingsTriggerProps = {
    onPress: onPressTransactionSettings,
    testID: testID ?? TestID.TransactionSettings,
  }

  return (
    <>
      <ViewOnlyModal isOpen={isViewOnlyModalVisible} onDismiss={handleHideViewOnlyModal} />
      <Flex row gap="$spacing4" position={position} top={topAlignment} right={rightAlignment} zIndex="$default">
        {isViewOnlyWallet ? (
          <ViewOnlyButton onPress={handleShowViewOnlyModal} />
        ) : (
          <Popover
            offset={popoverOffset}
            placement="bottom-end"
            open={isTransactionSettingsModalVisible}
            onOpenChange={onPopoverOpenChange}
          >
            <Flex>
              <Popover.Trigger>
                {renderTrigger ? (
                  renderTrigger(triggerProps)
                ) : (
                  <SettingsTrigger {...triggerProps} fixedHeight={isWebApp} />
                )}
              </Popover.Trigger>
              <TransactionSettingsModal
                settings={settings}
                defaultTitle={defaultTitle}
                isOpen={isTransactionSettingsModalVisible}
                onClose={onCloseSettingsModal}
              />
            </Flex>
          </Popover>
        )}
      </Flex>
    </>
  )
}
