import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ModalContent } from '~/components/NavBar/DownloadApp/Modal/Content'
import { TokenCarousel } from '~/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/TokenCarousel'
import { PrivyWatermark } from '~/components/Passkey/PrivyWatermark'

function WelcomeHeader(): JSX.Element {
  return (
    <Flex centered width="100%">
      <Flex centered position="absolute" top={0} left={0} right={0} bottom={0} opacity={0.5}>
        <TokenCarousel />
      </Flex>
      <Flex
        centered
        borderRadius="$rounded16"
        backgroundColor="$surface1"
        borderWidth="$spacing1"
        borderColor="$surface3"
        p="$spacing12"
        style={{
          filter:
            'drop-shadow(0px 1.8px 3.6px rgba(189, 0, 145, 0.10)) drop-shadow(0px 7.2px 21.6px rgba(255, 47, 207, 0.10))',
          backdropFilter: 'blur(10.8px)',
        }}
      >
        <UniswapLogo size="$icon.48" color="$accent1" />
      </Flex>
    </Flex>
  )
}

export function WelcomeScreen({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Trace logImpression modal={ModalName.EmbeddedWalletWelcome}>
      <ModalContent
        title={t('embeddedWallet.onboarding.welcome.title')}
        subtext={
          // Max width per the mock so the copy wraps after "buy".
          <Text variant="body2" color="$neutral2" textAlign="center" maxWidth={254}>
            {t('embeddedWallet.onboarding.welcome.subtitle')}
          </Text>
        }
        header={<WelcomeHeader />}
        onClose={onClose}
        footer={<PrivyWatermark pt="$spacing24" />}
        // 24px between the body copy and the button, per the mock. On the mweb bottom sheet
        // ($md, same query the modal uses to switch to WebBottomSheet), 12px of breathing room
        // between the drag handle and the carousel.
        gap="$spacing24"
        $md={{ pt: '$spacing12' }}
      >
        <Flex width="100%">
          <Flex row alignSelf="stretch">
            <Trace logPress element={ElementName.Continue}>
              <Button testID={TestID.Continue} variant="branded" size="large" onPress={onContinue}>
                {t('common.button.continue')}
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </ModalContent>
    </Trace>
  )
}
