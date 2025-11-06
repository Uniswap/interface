import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { TokenCarousel } from 'components/NavBar/DownloadApp/Modal/TokenCarousel'
import { DownloadWalletRow } from 'components/WalletModal/DownloadWalletRow'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image } from 'ui/src'
import { UNISWAP_MONO_LOGO_LARGE } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

function Header() {
  return (
    <Flex width="100%" px="$spacing32" mb="$padding20">
      <Flex centered position="absolute" top="0" left="0" right="0" bottom="0" px="$spacing32" opacity={0.5}>
        <TokenCarousel />
      </Flex>
      <Flex
        centered
        borderRadius="$rounded16"
        backgroundColor="$surface1"
        borderWidth={1}
        borderColor="$surface3"
        alignSelf="center"
        p="$spacing12"
        style={{
          filter:
            'drop-shadow(0px 1.8px 3.6px rgba(189, 0, 145, 0.10)) drop-shadow(0px 7.2px 21.6px rgba(255, 47, 207, 0.10))',
          backdropFilter: 'blur(10.799999237060547px)',
        }}
      >
        <Image source={UNISWAP_MONO_LOGO_LARGE} height={iconSizes.icon48} width={iconSizes.icon48} />
      </Flex>
    </Flex>
  )
}
export function GetStarted({
  onClose,
  setPage,
  toConnectWalletDrawer,
}: {
  onClose: () => void
  setPage: Dispatch<SetStateAction<Page>>
  toConnectWalletDrawer: () => void
}) {
  const { t } = useTranslation()

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <Trace logImpression modal={ModalName.SignUp}>
      <ModalContent
        title={t('downloadApp.modal.getStarted.title')}
        subtext={t('downloadApp.modal.getStarted.description')}
        onClose={onClose}
        header={<Header />}
        footer={
          <DownloadWalletRow
            onPress={() => setPage(Page.GetApp)}
            px="$spacing16"
            mx="$spacing4"
            mb="$spacing4"
            borderBottomLeftRadius="$rounded16"
            borderBottomRightRadius="$rounded16"
            $md={{ mb: '$spacing12', mx: '$spacing12' }}
          />
        }
      >
        <Flex gap="$spacing20" width="100%" px="$spacing32" pb="$spacing24">
          <Flex row>
            <Trace logPress element={ElementName.CreateAWallet}>
              <Button
                testID={TestID.CreateAccount}
                variant="branded"
                onPress={() => setPage(Page.ChooseUnitag)}
                display={isEmbeddedWalletEnabled ? 'flex' : 'none'}
              >
                {t('nav.createAccount.button')}
              </Button>
            </Trace>
          </Flex>
          <Trace logPress element={ElementName.ConnectExistingWallet}>
            <Button variant="branded" emphasis="text-only" onPress={toConnectWalletDrawer}>
              {t('downloadApp.modal.connectExistingWallet')}
            </Button>
          </Trace>
        </Flex>
      </ModalContent>
    </Trace>
  )
}
