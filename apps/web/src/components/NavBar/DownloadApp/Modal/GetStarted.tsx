import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { TokenCarousel } from 'components/NavBar/DownloadApp/Modal/TokenCarousel'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { JuiceSwapLogo } from 'ui/src/components/icons/JuiceSwapLogo'
import { iconSizes } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

function Header() {
  return (
    <Flex width="100%" px="$spacing32" mb="$padding20">
      <Flex centered position="absolute" top="0" left="0" right="0" bottom="0" px="$spacing32" opacity={0.5}>
        <TokenCarousel />
      </Flex>
      <Flex centered alignSelf="center" p="$spacing12">
        <Flex
          centered
          backgroundColor="white"
          borderRadius={iconSizes.icon48 / 2}
          width={iconSizes.icon48}
          height={iconSizes.icon48}
        >
          <JuiceSwapLogo size={iconSizes.icon48} />
        </Flex>
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
        footer={null}
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
