import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { useModalState } from 'hooks/useModalState'
import { useSignInWithPasskey } from 'hooks/useSignInWithPasskey'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { Faceid } from 'ui/src/components/icons/Faceid'
import { Fingerprint } from 'ui/src/components/icons/Fingerprint'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export function PasskeyGenerationModal({
  unitag,
  setPage,
  onClose,
  goBack,
}: {
  unitag: string
  setPage: Dispatch<SetStateAction<Page>>
  onClose: () => void
  goBack: () => void
}) {
  const { t } = useTranslation()
  const { closeModal } = useModalState(ModalName.GetTheApp)

  const onSuccess = useEvent(() => {
    closeModal()
    setPage(Page.GetStarted)
  })

  const { signInWithPasskey } = useSignInWithPasskey({
    createNewWallet: true,
    unitag,
    onSuccess,
    onError: () => {
      setPage(Page.GetStarted)
    },
  })

  return (
    <Trace logImpression modal={ModalName.CreatePasskey}>
      <ModalContent
        title={t('onboarding.passkey.secure')}
        subtext={t('onboarding.passkey.secure.description')}
        header={
          <Flex position="relative" height={48} width={80} alignItems="center" justifyContent="center">
            <Flex
              position="absolute"
              backgroundColor="$surface3Solid"
              p="$spacing12"
              borderRadius="$rounded16"
              transform={[{ rotate: '-15deg' }, { translateY: -5 }]}
              left={0}
            >
              <Fingerprint size="$icon.24" color="$neutral1" />
            </Flex>
            <Flex
              position="absolute"
              backgroundColor="$surface2"
              p="$spacing12"
              borderRadius="$rounded16"
              transform={[{ rotate: '15deg' }]}
              borderWidth={2}
              borderColor="$surface1"
              right={0}
            >
              <Faceid size="$icon.24" color="$neutral1" />
            </Flex>
          </Flex>
        }
        learnMoreLink={uniswapUrls.helpArticleUrls.passkeysInfo} // TODO(WEB-7390): add learn more link
        onClose={onClose}
        goBack={goBack}
      >
        <Flex px="$spacing32" mb="$spacing32" width="100%">
          <Trace logPress element={ElementName.CreatePasskey}>
            <Button
              testID={TestID.CreatePasskey}
              fill={false}
              icon={<Passkey size="$icon.24" />}
              variant="branded"
              size="large"
              onPress={() => signInWithPasskey()}
            >
              {t('onboarding.passkey.create')}
            </Button>
          </Trace>
        </Flex>
      </ModalContent>
    </Trace>
  )
}
