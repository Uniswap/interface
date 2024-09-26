import { SharedEventName } from '@uniswap/analytics-events'
import { BaseSyntheticEvent, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { EditLabelModal } from 'src/app/features/accounts/EditLabelModal'
import { removeAllDappConnectionsForAccount } from 'src/app/features/dapp/actions'
import { ContextMenu, Flex, MenuContentItem, Text, TouchableArea } from 'ui/src'
import { CopySheets, Edit, Ellipsis, TrashFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { NumberType } from 'utilities/src/format/types'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useActiveAccountWithThrow, useDisplayName, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type AccountItemProps = {
  address: Address
  onAccountSelect?: () => void
  balanceUSD?: number
}

export function AccountItem({ address, onAccountSelect, balanceUSD }: AccountItemProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { convertFiatAmountFormatted } = useLocalizationContext()

  const formattedBalance = convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance)

  const [showEditLabelModal, setShowEditLabelModal] = useState(false)

  const displayName = useDisplayName(address)
  const hasDisplayName = displayName?.type === DisplayNameType.Unitag || displayName?.type === DisplayNameType.ENS

  const accounts = useSignerAccounts()
  const activeAccount = useActiveAccountWithThrow()
  const activeAccountDisplayName = useDisplayName(activeAccount.address)

  const [showRemoveWalletModal, setShowRemoveWalletModal] = useState(false)
  const onRemoveWallet = useCallback(async () => {
    const accountForDeletion = accounts.find((account) => account.address === address)
    if (!accountForDeletion) {
      return
    }

    await removeAllDappConnectionsForAccount(accountForDeletion)
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Remove,
        accounts: [accountForDeletion],
      }),
    )
  }, [accounts, address, dispatch])

  const onPressCopyAddress = useCallback(
    async (e: BaseSyntheticEvent) => {
      // We have to manually prevent click-through because the way the context menu is inside of a TouchableArea in this component it
      // means that without it the TouchableArea handler will get called
      // TODO(EXT-1325): Use a different ContextMenu component that works inside a TouchableArea
      e.preventDefault()
      e.stopPropagation()

      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        }),
      )
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.CopyAddress,
        modal: ModalName.AccountSwitcher,
      })
    },
    [address, dispatch],
  )

  const menuOptions = useMemo((): MenuContentItem[] => {
    return [
      // hide edit label if account has unitag or ENS
      ...(!hasDisplayName
        ? [
            {
              label: t('account.wallet.menu.edit.title'),
              onPress: (e: BaseSyntheticEvent): void => {
                // We have to manually prevent click-through because the way the context menu is inside of a TouchableArea in this component it
                // means that without it the TouchableArea handler will get called
                e.preventDefault()
                e.stopPropagation()

                setShowEditLabelModal(true)
              },
              Icon: Edit,
            },
          ]
        : []),

      {
        label: t('account.wallet.menu.copy.title'),
        onPress: onPressCopyAddress,
        Icon: CopySheets,
      },
      {
        label: t('account.wallet.menu.remove.title'),
        onPress: (e: BaseSyntheticEvent): void => {
          // We have to manually prevent click-through because the way the context menu is inside of a TouchableArea in this component it
          // means that without it the TouchableArea handler will get called
          e.preventDefault()
          e.stopPropagation()

          setShowRemoveWalletModal(true)
        },
        textProps: { color: '$statusCritical' },
        Icon: TrashFilled,
        iconProps: { color: '$statusCritical' },
      },
    ]
  }, [hasDisplayName, onPressCopyAddress, t])

  return (
    <>
      <WarningModal
        caption={t('account.recoveryPhrase.remove.mnemonic.description', {
          walletNames: [activeAccountDisplayName?.name ?? ''],
        })}
        closeText={t('common.button.cancel')}
        confirmText={t('common.button.continue')}
        icon={<TrashFilled color="$statusCritical" size="$icon.24" strokeWidth="$spacing1" />}
        isOpen={showRemoveWalletModal}
        modalName={ModalName.RemoveWallet}
        severity={WarningSeverity.High}
        title={t('account.wallet.remove.title', { name: displayName?.name ?? '' })}
        onClose={() => setShowRemoveWalletModal(false)}
        onConfirm={onRemoveWallet}
      />
      <EditLabelModal address={address} isOpen={showEditLabelModal} onClose={() => setShowEditLabelModal(false)} />
      <TouchableArea
        hoverable
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        cursor="pointer"
        p="$spacing12"
        onPress={onAccountSelect}
      >
        <Flex centered fill group row gap="$spacing8" justifyContent="space-between">
          <AddressDisplay
            address={address}
            captionVariant="body3"
            showViewOnlyBadge={false}
            size={iconSizes.icon40}
            variant="subheading2"
          />
          <Flex>
            <Text
              $group-hover={{ opacity: 0 }}
              color="$neutral2"
              opacity={1}
              position="absolute"
              right={0}
              top="50%"
              transform="translateY(-50%)"
              variant="body3"
            >
              {formattedBalance}
            </Text>
            <ContextMenu closeOnClick itemId={address} menuOptions={menuOptions} onLeftClick>
              <Flex
                $group-hover={{ opacity: 1 }}
                borderRadius="$roundedFull"
                hoverStyle={{ backgroundColor: '$surface2Hovered' }}
                opacity={0}
                p="$spacing4"
              >
                <Ellipsis color="$neutral2" size="$icon.16" />
              </Flex>
            </ContextMenu>
          </Flex>
        </Flex>
      </TouchableArea>
    </>
  )
}
