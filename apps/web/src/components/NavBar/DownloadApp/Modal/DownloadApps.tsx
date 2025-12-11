import AppStoreBadge from 'assets/images/app-store-badge.png'
import ExtensionIllustration from 'assets/images/extensionIllustration.png'
import PlayStoreBadge from 'assets/images/play-store-badge.png'
import WalletIllustration from 'assets/images/walletIllustration.png'
import { Wiggle } from 'components/animations/Wiggle'
import Column from 'components/deprecated/Column'
import { AndroidLogo } from 'components/Icons/AndroidLogo'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { useAccount } from 'hooks/useAccount'
import { deprecatedStyled } from 'lib/styled-components'
import { lazy, PropsWithChildren, ReactNode, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { updateDownloadGraduatedWalletCardsDismissed } from 'state/application/reducer'
import { ExternalLink } from 'theme/components/Links'
import {
  AnimatedPager,
  Flex,
  FlexProps,
  Image,
  Loader,
  ModalCloseIcon,
  styled,
  Text,
  TouchableArea,
  useSporeColors,
} from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'

const LazyWalletOneLinkQR = lazy(async () => {
  const module = await import('components/WalletOneLinkQR')
  return { default: module.WalletOneLinkQR }
})

const BadgeLink = deprecatedStyled(ExternalLink)`
  stroke: none;
  :hover {
    opacity: 1;
  }
`

const WiggleIcon = styled(Wiggle, {
  flex: 0,
  height: 'auto',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})
const IllustrationContainer = deprecatedStyled.div`
  display: flex;
  width: 100%;
  border-radius: 16px;
  border: ${({ theme }) => `1px solid ${theme.neutral3}`};
  overflow: hidden;
`
const Illustration = deprecatedStyled.img`
  width: 100%;
  transition: ${({ theme }) => `transform ${theme.transition.timing.inOut} ${theme.transition.duration.medium}`};
`
const Card = deprecatedStyled(Column)`
  cursor: pointer;
  &:hover {
    ${Illustration} {
      transform: scale(1.1);
    }
  }
`

function ModalContent({
  header,
  title,
  subtext,
  children,
  logo,
  ...rest
}: PropsWithChildren<{ title: string; subtext?: string; logo?: ReactNode; header?: ReactNode }> & FlexProps) {
  return (
    <Flex p={24} alignItems="center" gap="$spacing32" {...rest}>
      <Flex alignItems="center" gap="$spacing12">
        {header}
        <Flex alignItems="center" gap="$spacing8">
          <Text variant="heading3" color="$neutral1">
            {title}
          </Text>
          <Text variant="body2" color="$neutral2" textAlign="center">
            {subtext}
          </Text>
        </Flex>
      </Flex>
      {children}
    </Flex>
  )
}

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

function DownloadMobile() {
  const { t } = useTranslation()
  const account = useAccount()
  return (
    <ModalContent
      title={t('common.downloadUniswapApp')}
      subtext={t('common.scanQRDownload')}
      maxWidth="620px"
      px="60px"
      my="$spacing24"
    >
      <BadgeLink href="https://uniswapwallet.onelink.me/8q3y/m4i9qsez?af_qr=true">
        <Suspense fallback={<Loader.Box width={200} height={200} />}>
          <LazyWalletOneLinkQR width={200} height={200} />
        </Suspense>
      </BadgeLink>
      <Trace
        logPress
        element={ElementName.UniswapWalletModalDownloadButton}
        properties={{ connector_id: account.connector?.id }}
      >
        <Flex row justifyContent="center" gap="$spacing16">
          <BadgeLink href="https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476">
            <Image src={AppStoreBadge} alt="App Store Badge" width={150} height={50} />
          </BadgeLink>
          <BadgeLink href="https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share">
            <Image src={PlayStoreBadge} alt="Play Store Badge" width={170} height={50} />
          </BadgeLink>
        </Flex>
      </Trace>
    </ModalContent>
  )
}

enum Page {
  DownloadApps = 0,
  DownloadMobile = 1,
}

function DownloadApps({ setPage }: { setPage: (page: Page) => void }) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const account = useAccount()
  const dispatch = useDispatch()

  const onPressCard = useEvent(() => {
    if (account.address) {
      dispatch(updateDownloadGraduatedWalletCardsDismissed({ walletAddress: account.address }))
    }
  })

  return (
    <Trace logImpression modal={ModalName.DownloadApp} properties={{ connector_id: account.connector?.id }}>
      <ModalContent
        title={t('downloadApp.modal.getTheApp.title')}
        subtext={t('downloadApp.modal.uniswapProducts.subtitle')}
        header={<Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />}
        maxWidth="620px"
      >
        <Flex row gap="$spacing12" width="100%" alignItems="flex-start">
          <Card
            flex="1 1 auto"
            onClick={() => {
              setPage(Page.DownloadMobile)
              onPressCard()
            }}
          >
            <IllustrationContainer>
              <Illustration src={WalletIllustration} alt="Wallet example page" />
            </IllustrationContainer>
            <CardInfo title={t('common.uniswapMobile')} details={t('common.iOSAndroid')}>
              <Trace
                logPress
                element={ElementName.UniswapWalletModalDownloadButton}
                properties={{ connector_id: account.connector?.id }}
              >
                <Flex row gap="$spacing8" alignItems="center">
                  <WiggleIcon>
                    <AppleLogo fill={colors.neutral1.val} />
                  </WiggleIcon>
                  <WiggleIcon>
                    <AndroidLogo fill={colors.neutral1.val} />
                  </WiggleIcon>
                </Flex>
              </Trace>
            </CardInfo>
          </Card>
          <Trace logPress element={ElementName.ExtensionDownloadButton}>
            <Card
              onClick={() => {
                window.open(uniswapUrls.chromeExtension)
                onPressCard()
              }}
            >
              <IllustrationContainer>
                <Illustration src={ExtensionIllustration} alt="Extension example page" />
              </IllustrationContainer>
              <CardInfo title={t('common.chromeExtension')} details="Google Chrome">
                <Flex row gap="$spacing8">
                  <WiggleIcon>
                    <GoogleChromeLogo size={iconSizes.icon16} />
                  </WiggleIcon>
                </Flex>
              </CardInfo>
            </Card>
          </Trace>
        </Flex>
      </ModalContent>
    </Trace>
  )
}

export function DownloadAppsModal({ goBack, onClose }: { goBack?: () => void; onClose: () => void }) {
  const [page, setPage] = useState<Page>(Page.DownloadApps)
  const showBackButton = goBack || page !== Page.DownloadApps

  const onPressBack = useEvent(() => {
    if (page === Page.DownloadMobile) {
      setPage(Page.DownloadApps)
    } else {
      goBack?.()
    }
  })

  return (
    <Flex maxWidth="620px">
      <Flex
        row
        position="absolute"
        top="$spacing24"
        width="100%"
        justifyContent={showBackButton ? 'space-between' : 'flex-end'}
        zIndex={zIndexes.modal}
        pl="$spacing24"
        pr="$spacing24"
      >
        {showBackButton && (
          <TouchableArea onPress={onPressBack}>
            <BackArrow size="$icon.24" color="$neutral2" hoverColor="$neutral2Hovered" />
          </TouchableArea>
        )}
        <ModalCloseIcon onClose={onClose} data-testid="get-the-app-close-button" />
      </Flex>
      <Flex position="relative" userSelect="none">
        {/* The Page enum value corresponds to the modal page's index */}
        <AnimatedPager currentIndex={page}>
          <DownloadApps setPage={setPage} />
          <DownloadMobile />
        </AnimatedPager>
      </Flex>
    </Flex>
  )
}
