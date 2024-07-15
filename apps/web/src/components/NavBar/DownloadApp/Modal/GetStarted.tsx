import { InterfaceElementName } from '@uniswap/analytics-events'
import ExtensionIllustration from 'assets/images/extensionIllustration.png'
import WalletIllustration from 'assets/images/walletIllustration.png'
import Column from 'components/Column'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { GoogleChromeLogo } from 'components/Icons/GoogleChromeLogo'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { WiggleIcon } from 'components/NavBar/DownloadApp/GetTheAppButton'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import Row from 'components/Row'
import styled, { useTheme } from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'

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
    <Row padding="16px 12px" justify="space-between" align="start">
      <Column>
        <Text variant="body2" fontWeight="535">
          {title}
        </Text>
        <Text variant="body4" color="$neutral2">
          {details}
        </Text>
      </Column>
      <RightContent>{children}</RightContent>
    </Row>
  )
}

export function GetStarted({ toAppDownload }: { toAppDownload: () => void }) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <ModalContent title={t('uniswap.wallet.modal.title')} subtext={t('uniswap.wallet.modal.subtitle')}>
      <Row gap="12px" width="100%" flex="auto" align="start">
        <Card flex="1 1 auto" onClick={toAppDownload}>
          <IllustrationContainer>
            <Illustration src={WalletIllustration} alt="Wallet example page" />
          </IllustrationContainer>
          <CardInfo title={t('common.uniswapMobile')} details={t('common.iOSAndroid')}>
            <Row gap="8px" width="auto">
              <WiggleIcon>
                <AppleLogo fill={theme.neutral1} />
              </WiggleIcon>
              <WiggleIcon>
                <GooglePlayStoreLogo />
              </WiggleIcon>
            </Row>
          </CardInfo>
        </Card>
        <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_BUTTON}>
          <Card onClick={() => window.open(uniswapUrls.chromeExtension)}>
            <IllustrationContainer>
              <Illustration src={ExtensionIllustration} alt="Extension example page" />
            </IllustrationContainer>
            <CardInfo title={t('common.chromeExtension')} details={t('common.googleChrome')}>
              <Row gap="8px" width="auto">
                <WiggleIcon>
                  <GoogleChromeLogo width="16px" height="16px" />
                </WiggleIcon>
              </Row>
            </CardInfo>
          </Card>
        </Trace>
      </Row>
    </ModalContent>
  )
}
