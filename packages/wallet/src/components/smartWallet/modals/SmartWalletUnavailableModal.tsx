import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'

interface SmartWalletUnavailableModalProps {
  isOpen: boolean
  onClose: () => void
  displayName: string
  walletAddress: string
}

export function SmartWalletUnavailableModal({
  isOpen,
  onClose,
  displayName,
  walletAddress,
}: SmartWalletUnavailableModalProps): JSX.Element {
  const { t } = useTranslation()
  const { avatar } = useAvatar(walletAddress)

  const walletIcon = useMemo(
    () => (
      <Flex opacity={0.3}>
        <AccountIcon avatarUri={avatar} address={walletAddress} size={iconSizes.icon48} />
      </Flex>
    ),
    [avatar, walletAddress],
  )

  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={walletIcon}
      title={t('smartWallets.unavailableModal.title')}
      subtext={t('smartWallets.unavailableModal.description', { displayName })}
      modalName={ModalName.SmartWalletUnavailableModal}
      learnMoreUrl={uniswapUrls.helpArticleUrls.mismatchedImports}
      primaryButtonText={t('common.close')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      onClose={onClose}
    />
  )
}
