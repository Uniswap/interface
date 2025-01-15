import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import WalletModal from 'components/WalletModal'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, styled as tamaguiStyled } from 'ui/src'
import { iconSizes, zIndices } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const CloseButton = tamaguiStyled(X, {
  ...ClickableTamaguiStyle,

  color: 'white',
  borderRadius: '100%',
  backgroundColor: '$surface3',
  p: '$spacing4',
  m: '$none',
  size: iconSizes.icon28,
})

export function SignInModal({ isOpen, close }: { isOpen: boolean; close: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal name={ModalName.SignIn} isModalOpen={isOpen} onClose={close} maxWidth={440} padding={0}>
      <Flex position="relative" width="100%" height="100%">
        <Flex
          row
          position="absolute"
          top={28}
          width="100%"
          justifyContent="flex-end"
          zIndex={zIndices.modal}
          pl="$spacing24"
          pr="$spacing24"
        >
          <CloseButton onClick={close} data-testid="sign-in-close-button" />
        </Flex>
        <ModalContent title={t('nav.signIn.button')}>
          <WalletModal />
        </ModalContent>
      </Flex>
    </Modal>
  )
}
