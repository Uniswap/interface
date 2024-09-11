import { InterfaceElementName } from '@uniswap/analytics-events'
import ExtensionIllustration from 'assets/images/extensionIllustration.png'
import WalletIllustration from 'assets/images/walletIllustration.png'
import Column from 'components/Column'
import { AndroidLogo } from 'components/Icons/AndroidLogo'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { GoogleChromeLogo } from 'components/Icons/GoogleChromeLogo'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { AccountCTAsExperimentGroup } from 'components/NavBar/accountCTAsExperimentUtils'
import styled, { useTheme } from 'lib/styled-components'
import { Wiggle } from 'pages/Landing/components/animations'
import { PropsWithChildren } from 'react'
import { StyledInternalLink } from 'theme/components'
import { Button, Flex, Text, styled as tamaguiStyled } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trans, useTranslation } from 'uniswap/src/i18n'

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

const SmallCard = tamaguiStyled(Button, {
  width: '100%',
  height: 72,
  backgroundColor: '$surface3',
  borderRadius: '$spacing16',
  borderWidth: 0,
  hoverStyle: {
    backgroundColor: '$surface3',
    opacity: 0.9,
  },
  pressStyle: {
    backgroundColor: '$surface3',
    opacity: 0.7,
  },
})

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
  toAppDownload,
  toConnectWalletDrawer,
}: {
  toAppDownload: () => void
  toConnectWalletDrawer: () => void
}) {
  const theme = useTheme()
  const { t } = useTranslation()

  const isSignUp = useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp
  const isCreateAccount =
    useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount

  return isSignUp || isCreateAccount ? (
    <ModalContent
      title={isSignUp ? t('downloadApp.modal.signUp.title') : t('downloadApp.modal.getStarted.title')}
      subtext={isSignUp ? t('downloadApp.modal.signUp.description') : t('downloadApp.modal.getStarted.description')}
      rightThumbnail={<PromoImage />}
    >
      <Flex gap="$spacing24" width="100%">
        <Flex gap="$spacing12" alignItems="flex-start">
          <SmallCard onPress={toAppDownload}>
            <CardInfo title={t('common.mobileWallet')} details={t('common.iOSAndroid')}>
              <Flex row gap="$spacing8">
                <WiggleIcon>
                  <AppleLogo fill={theme.neutral1} />
                </WiggleIcon>
                <WiggleIcon>
                  <AndroidLogo fill={theme.neutral1} />
                </WiggleIcon>
              </Flex>
            </CardInfo>
          </SmallCard>
          <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_BUTTON}>
            <SmallCard onPress={() => window.open(uniswapUrls.chromeExtension)}>
              <CardInfo title={t('common.chromeExtension')} details="Google Chrome">
                <Flex row gap="$spacing8">
                  <WiggleIcon>
                    <GoogleChromeLogo width="16px" height="16px" />
                  </WiggleIcon>
                </Flex>
              </CardInfo>
            </SmallCard>
          </Trace>
        </Flex>
        <Text variant="body2" $xxl={{ variant: 'body3' }} color="$neutral2" textAlign="center" width="100%">
          <Trans
            i18nKey="downloadApp.modal.alreadyHaveWallet"
            components={{
              signInHere: (
                <Trace logPress element={ElementName.AlreadyHaveWalletSignIn}>
                  <StyledInternalLink style={{ color: theme.neutral1 }} to="" onClick={toConnectWalletDrawer}>
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
        <Card flex="1 1 auto" onClick={toAppDownload}>
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
