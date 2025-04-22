import { InterfaceElementName } from '@uniswap/analytics-events'
import ExtensionIllustration from 'assets/images/extensionIllustration.png'
import WalletIllustration from 'assets/images/walletIllustration.png'
import { AndroidLogo } from 'components/Icons/AndroidLogo'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { GoogleChromeLogo } from 'components/Icons/GoogleChromeLogo'
import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import Column from 'components/deprecated/Column'
import styled, { useTheme } from 'lib/styled-components'
import { Wiggle } from 'pages/Landing/components/animations'
import { Dispatch, PropsWithChildren, SetStateAction } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyledInternalLink } from 'theme/components/Links'
import { Button, Flex, Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

const WiggleIcon = styled(Wiggle)`
  flex: 0;
  height: auto;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`
const IllustrationContainer = styled.div`
  display: flex;
  max-width: 100%;
  border-radius: 16px;
  border: ${({ theme }) => `1px solid ${theme.neutral3}`};
  overflow: hidden;
`
const Illustration = styled.img`
  width: 100%;
  transition: ${({ theme }) => `transform ${theme.transition.timing.inOut} ${theme.transition.duration.medium}`};
`
const Card = styled(Column)`
  cursor: pointer;
  &:hover {
    ${Illustration} {
      transform: scale(1.1);
    }
  }
`

const PromoImage = styled.img`
  display: flex;
  width: 320px;
  height: 100%;
  background: url('/images/extension_promo/announcement_modal_desktop2.png');
  background-repeat: no-repeat;
  background-size: cover;
  flex: 1;
`

function CardInfo({ title, details, children }: PropsWithChildren<{ title: string; details: string }>) {
  return (
    <Flex row p="$spacing8" justifyContent="space-between" alignItems="center" width="100%">
      <Flex alignItems="flex-start">
        <Text variant="body2" fontWeight="535">
          {title}
        </Text>
        <Text variant="body4" color="$neutral2">
          {details}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
}

export function GetStarted({
  setPage,
  toConnectWalletDrawer,
}: {
  setPage: Dispatch<SetStateAction<Page>>
  toConnectWalletDrawer: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const isSignUp =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp ||
    isEmbeddedWalletEnabled
  const isCreateAccount =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount &&
    !isEmbeddedWalletEnabled

  return isSignUp || isCreateAccount ? (
    <ModalContent
      title={isSignUp ? t('downloadApp.modal.signUp.title') : t('downloadApp.modal.getStarted.title')}
      subtext={
        isEmbeddedWalletEnabled
          ? t('downloadApp.modal.signUp.description.embeddedWallet')
          : isSignUp
            ? t('downloadApp.modal.signUp.description')
            : t('downloadApp.modal.getStarted.description')
      }
      rightThumbnail={<PromoImage />}
    >
      <Flex gap="$spacing16" width="100%">
        <Flex row>
          <Button
            variant="branded"
            onPress={() => setPage(Page.PasskeyGeneration)}
            display={isEmbeddedWalletEnabled ? 'flex' : 'none'}
          >
            {t('nav.signUp.button')}
          </Button>
        </Flex>
        <Flex flexDirection={isEmbeddedWalletEnabled ? 'row' : 'column'} gap="$gap12">
          <Button gap="$spacing12" emphasis="secondary" onPress={() => setPage(Page.GetApp)}>
            <Button.Text>{t('common.mobile')}</Button.Text>
            <Flex row gap="$spacing4">
              <WiggleIcon>
                <AppleLogo fill={theme.neutral1} />
              </WiggleIcon>
              <WiggleIcon>
                <AndroidLogo fill={theme.neutral1} />
              </WiggleIcon>
            </Flex>
          </Button>
          <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_BUTTON}>
            <Button
              iconPosition="after"
              icon={
                <WiggleIcon>
                  <GoogleChromeLogo width="16px" height="16px" />
                </WiggleIcon>
              }
              emphasis="secondary"
              onPress={() => window.open(uniswapUrls.chromeExtension)}
            >
              {t('common.chromeExtension')}
            </Button>
          </Trace>
        </Flex>
        <Text
          variant="body2"
          $xxl={{ variant: 'body3' }}
          color="$neutral2"
          textAlign="center"
          width="100%"
          py="$spacing12"
        >
          <Trans
            i18nKey="downloadApp.modal.alreadyHaveWallet"
            components={{
              signInHere: (
                <Trace logPress element={ElementName.AlreadyHaveWalletSignIn}>
                  <StyledInternalLink
                    style={{ color: theme.neutral1 }}
                    to=""
                    onClick={(e) => {
                      e.preventDefault()
                      toConnectWalletDrawer()
                    }}
                  >
                    {t('downloadApp.modal.alreadyHaveWallet.signInLink')}
                  </StyledInternalLink>
                </Trace>
              ),
            }}
          />
        </Text>
      </Flex>
    </ModalContent>
  ) : (
    <ModalContent
      title={t('downloadApp.modal.getStarted.title')}
      subtext={t('downloadApp.modal.uniswapProducts.subtitle')}
    >
      <Flex row gap="$spacing12" width="100%" alignItems="flex-start">
        <Card flex="1 1 auto" onClick={() => setPage(Page.GetApp)}>
          <IllustrationContainer>
            <Illustration src={WalletIllustration} alt="Wallet example page" />
          </IllustrationContainer>
          <CardInfo title={t('common.uniswapMobile')} details={t('common.iOSAndroid')}>
            <Flex row gap="$spacing8">
              <WiggleIcon>
                <AppleLogo fill={theme.neutral1} />
              </WiggleIcon>
              <WiggleIcon>
                <AndroidLogo fill={theme.neutral1} />
              </WiggleIcon>
            </Flex>
          </CardInfo>
        </Card>
        <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_BUTTON}>
          <Card onClick={() => window.open(uniswapUrls.chromeExtension)}>
            <IllustrationContainer>
              <Illustration src={ExtensionIllustration} alt="Extension example page" />
            </IllustrationContainer>
            <CardInfo title={t('common.chromeExtension')} details="Google Chrome">
              <Flex row gap="$spacing8">
                <WiggleIcon>
                  <GoogleChromeLogo width="16px" height="16px" />
                </WiggleIcon>
              </Flex>
            </CardInfo>
          </Card>
        </Trace>
      </Flex>
    </ModalContent>
  )
}
