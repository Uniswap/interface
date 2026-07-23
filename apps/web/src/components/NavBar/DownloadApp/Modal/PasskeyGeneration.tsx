import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { Faceid } from 'ui/src/components/icons/Faceid'
import { Fingerprint } from 'ui/src/components/icons/Fingerprint'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { Page } from '~/components/NavBar/DownloadApp/Modal/constants'
import { ModalContent } from '~/components/NavBar/DownloadApp/Modal/Content'
import { useModalState } from '~/hooks/useModalState'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'

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
  const [hasWalletCreationSuccess, setHasWalletCreationSuccess] = useState(false)

  const onSuccess = useEvent(async () => {
    setHasWalletCreationSuccess(true)
    await new Promise((resolve) => setTimeout(resolve, 500)) // show success state for 500ms
    closeModal()
    setPage(Page.DownloadApp)
  })

  const { signInWithPasskey, isPending } = useSignInWithPasskey({
    createNewWallet: true,
    unitag,
    onSuccess,
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
              backgroundColor="$surface2"
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
        learnMoreLink={UniswapHelpUrls.articles.passkeysInfo}
        onClose={onClose}
        goBack={goBack}
      >
        <Flex width="100%">
          <Trace logPress element={ElementName.CreatePasskey}>
            <Button
              testID={TestID.CreatePasskey}
              fill={false}
              icon={
                hasWalletCreationSuccess ? (
                  <Check size="$icon.24" color="$neutral2" />
                ) : (
                  <Passkey size="$icon.24" color="$white" />
                )
              }
              emphasis="primary"
              variant="branded"
              size="large"
              isDisabled={hasWalletCreationSuccess}
              loading={isPending && !hasWalletCreationSuccess}
              onPress={() => signInWithPasskey()}
            >
              {hasWalletCreationSuccess
                ? t('onboarding.passkey.create.success')
                : isPending
                  ? t('onboarding.passkey.create.pending')
                  : t('onboarding.passkey.create')}
            </Button>
          </Trace>
        </Flex>
      </ModalContent>
    </Trace>
  )
}
