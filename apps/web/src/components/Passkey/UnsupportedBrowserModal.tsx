import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { ModalContent } from '~/components/NavBar/DownloadApp/Modal/Content'
import { useModalState } from '~/hooks/useModalState'
import { setOpenModal } from '~/state/application/reducer'

/** Shown when wallet creation can't produce a usable passkey on the current OS/browser. */
export function UnsupportedBrowserModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isOpen, closeModal } = useModalState(ModalName.UnsupportedBrowser)

  const handleGetUniswapWallet = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.GetTheApp, initialState: { initialInnerPage: 'mobile' } }))
  })

  return (
    <Modal
      name={ModalName.UnsupportedBrowser}
      isModalOpen={isOpen}
      onClose={closeModal}
      maxWidth={420}
      gap="$spacing16"
    >
      <GetHelpHeader closeModal={closeModal} link={UniswapHelpUrls.articles.passkeysInfo} />
      <ModalContent
        title={t('onboarding.passkey.unsupported.title')}
        subtext={t('onboarding.passkey.unsupported.description')}
        header={
          <Flex p="$padding12" backgroundColor="$surface3" borderRadius="$rounded12">
            <AlertTriangleFilled color="$neutral1" size="$icon.24" />
          </Flex>
        }
      >
        <Flex width="100%" gap="$spacing8">
          <Flex row alignSelf="stretch">
            <Button
              testID={TestID.UnsupportedBrowserGetWallet}
              variant="default"
              emphasis="primary"
              size="medium"
              onPress={handleGetUniswapWallet}
            >
              {t('common.getUniswapWallet')}
            </Button>
          </Flex>
          <Flex row alignSelf="stretch">
            <Button
              testID={TestID.UnsupportedBrowserClose}
              variant="default"
              emphasis="secondary"
              size="medium"
              onPress={closeModal}
            >
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
