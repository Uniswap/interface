import { useTranslation } from 'react-i18next'
import { Button, ElementAfterText, Flex, Separator, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { isMobileApp } from 'utilities/src/platform'
import { useTranslateSmartWalletStatus } from 'wallet/src/features/smartWallet/hooks/useTranslateSmartWalletStatus'
import { WalletData } from 'wallet/src/features/smartWallet/types'

interface SmartWalletDisableModalProps {
  selectedWallet?: WalletData
  onClose: () => void
  onConfirm: () => void
}

export function SmartWalletDisableModal({
  selectedWallet,
  onClose,
  onConfirm,
}: SmartWalletDisableModalProps): JSX.Element | null {
  const { t } = useTranslation()
  const getTranslatedStatus = useTranslateSmartWalletStatus()

  const { avatar } = useAvatar(selectedWallet?.address)
  const { unitag } = useUnitagByAddress(selectedWallet?.address)

  if (!selectedWallet) {
    return null
  }

  const { address, name: walletName } = selectedWallet

  // TODO: fix mobile styling
  return (
    <Modal isModalOpen alignment="top" name={ModalName.SmartWalletDisableModal} onClose={onClose}>
      <Flex
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        gap="$gap16"
        p={isMobileApp ? '$spacing24' : undefined}
        pt={isMobileApp ? '$none' : undefined}
      >
        <Flex row alignItems="center" gap="$spacing12">
          <AccountIcon avatarUri={avatar} address={address} size={iconSizes.icon40} />
          <Flex>
            <Text variant="body1">{t('settings.setting.smartWallet.action.smartWallet')}</Text>
            <Text variant="body2" color="$accent1">
              {getTranslatedStatus(selectedWallet.status)}
            </Text>
          </Flex>
        </Flex>

        <Separator />

        <Flex row justifyContent="space-between">
          <Text variant="body2" color="$neutral2">
            {t('common.text.contract')}
          </Text>
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="body2">{shortenAddress(address)}</Text>
            <ExternalLink size={16} color="$neutral2" />
          </Flex>
        </Flex>

        <Flex row justifyContent="space-between">
          <Text variant="body2" color="$neutral2">
            {t('common.wallet.label')}
          </Text>
          <Flex row alignItems="center" gap="$spacing4">
            <AccountIcon avatarUri={avatar} address={address} size={iconSizes.icon16} />
            <ElementAfterText
              wrapperProps={{
                grow: true,
                shrink: true,
              }}
              textProps={{
                variant: 'body2',
                color: '$neutral1',
              }}
              element={unitag?.username ? <Unitag size="$icon.16" /> : undefined}
              text={walletName}
            />
          </Flex>
        </Flex>

        <Button fill size="small" minHeight="$spacing48" emphasis="secondary" onPress={onConfirm}>
          {t('common.button.disable')}
        </Button>
      </Flex>
    </Modal>
  )
}
