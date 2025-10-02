import type { ColorTokens, FlexProps, GeneratedIcon } from 'ui/src'
import { Flex, Popover, TouchableArea } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import type { IconSizeTokens } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { TransactionSettingsModalId } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import {
  useModalHide,
  useModalShow,
  useModalVisibility,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/useTransactionSettingsModalStore'
import { TransactionSettingsButton } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsButton'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import type { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { ViewOnlyButton } from 'uniswap/src/features/transactions/components/settings/ViewOnlyButton'
import { ViewOnlyModal } from 'uniswap/src/features/transactions/modals/ViewOnlyModal'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isMobileApp, isWebApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export interface TransactionSettingsProps {
  settings: TransactionSettingConfig[]
  adjustTopAlignment?: boolean
  adjustRightAlignment?: boolean
  position?: FlexProps['position']
  iconColor?: ColorTokens
  backgroundColor?: ColorTokens
  iconSize?: IconSizeTokens
  defaultTitle?: string
  shouldShowSettingsIconTooltip?: boolean
  IconLabel?: React.ReactNode
  CustomIconComponent?: GeneratedIcon
  testID?: string
  CustomSettingsButton?: React.ReactNode
  onClose?: () => void
}

export function TransactionSettings({
  settings,
  adjustTopAlignment = true,
  adjustRightAlignment = true,
  position = 'absolute',
  defaultTitle,
  CustomSettingsButton,
  testID,
  CustomIconComponent,
  iconColor = '$neutral2',
  backgroundColor,
  iconSize,
  IconLabel,
  onClose,
}: TransactionSettingsProps): JSX.Element {
  const account = useWallet().evmAccount
  const IconComponent = CustomIconComponent ?? Settings

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
                <TouchableArea testID={testID ?? TestID.TransactionSettings} onPress={onPressTransactionSettings}>
                  {CustomSettingsButton ?? (
                    <TransactionSettingsButton
                      contentColor={iconColor}
                      backgroundColor={backgroundColor}
                      CustomIconComponent={IconComponent}
                      iconSize={iconSize}
                      IconLabel={IconLabel}
                    />
                  )}
                </TouchableArea>
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
