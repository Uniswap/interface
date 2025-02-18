import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import WalletModal from 'components/WalletModal'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function SignInModal({ isOpen, close }: { isOpen: boolean; close: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal name={ModalName.SignIn} isModalOpen={isOpen} onClose={close} maxWidth={440} padding={0}>
      <Flex position="relative">
        <Flex
          row
          position="absolute"
          top={28}
          width="100%"
          justifyContent="flex-end"
          zIndex={zIndexes.modal}
          pl="$spacing24"
          pr="$spacing24"
        >
          <ModalCloseIcon onClose={close} testId="sign-in-close-button" />
        </Flex>
        <ModalContent title={t('nav.signIn.button')}>
          <WalletModal />
        </ModalContent>
      </Flex>
    </Modal>
  )
}
