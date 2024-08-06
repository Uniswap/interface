import { InterfaceElementName } from '@uniswap/analytics-events'
import ExtensionIllustration from 'assets/images/extensionIllustration.png'
import WalletIllustration from 'assets/images/walletIllustration.png'
import Column from 'components/Column'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { GoogleChromeLogo } from 'components/Icons/GoogleChromeLogo'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import styled, { useTheme } from 'lib/styled-components'
import { Wiggle } from 'pages/Landing/components/animations'
import { PropsWithChildren } from 'react'
import { Flex, Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTranslation } from 'uniswap/src/i18n'

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
const RightContent = styled.div`
  margin-top: 4px;
`

function CardInfo({ title, details, children }: PropsWithChildren<{ title: string; details: string }>) {
  return (
    <Flex row py="$spacing16" px="$spacing8" justifyContent="space-between" alignItems="flex-start">
      <Flex>
        <Text variant="body2" fontWeight="535">
          {title}
        </Text>
        <Text variant="body4" color="$neutral2">
          {details}
        </Text>
      </Flex>
      <RightContent>{children}</RightContent>
    </Flex>
  )
}

export function GetStarted({ toAppDownload }: { toAppDownload: () => void }) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <ModalContent title={t('uniswap.wallet.modal.title')} subtext={t('uniswap.wallet.modal.subtitle')}>
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
                <GooglePlayStoreLogo />
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
