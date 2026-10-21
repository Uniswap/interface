import { Flex, type FlexProps, Text, TouchableArea } from '@universe/mycelium'
import { AnimatedPager } from '@universe/mycelium/animate-presence-pager'
import { UNISWAP_LOGO } from '@universe/mycelium/assets'
import { styled } from '@universe/mycelium/styled'
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  lazy,
  PropsWithChildren,
  ReactNode,
  Suspense,
  useEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Loader, ModalCloseIcon } from 'ui/src'
import { AndroidLogo } from 'ui/src/components/icons/AndroidLogo'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import AppStoreBadge from '~/assets/images/app-store-badge.png'
import ExtensionIllustration from '~/assets/images/extensionIllustration.png'
import PlayStoreBadge from '~/assets/images/play-store-badge.png'
import WalletIllustration from '~/assets/images/walletIllustration.png'
import { Wiggle } from '~/components/animations/Wiggle'
import { TroubleLoggingInModule } from '~/components/NavBar/DownloadApp/Modal/TroubleLoggingInModule'
import { useAccount } from '~/hooks/useAccount'
import { ExternalLink, type ExternalLinkProps } from '~/theme/components/Links'

const LazyWalletOneLinkQR = lazy(async () => {
  const module = await import('~/components/WalletOneLinkQR')
  return { default: module.WalletOneLinkQR }
})

// The legacy `:hover { opacity: 1 }` compiled to a descendant selector (`.x :hover`), so it is
// reproduced verbatim rather than as a hover: rule on the link itself.
function BadgeLink(props: ExternalLinkProps): JSX.Element {
  return <ExternalLink className="[stroke:none] [&_:hover]:opacity-100" {...props} />
}

const WiggleIcon = forwardRef<ComponentRef<typeof Wiggle>, ComponentPropsWithoutRef<typeof Wiggle>>(
  function WiggleIcon(props, ref) {
    return (
      <Wiggle
        ref={ref}
        flex={0}
        height="auto"
        cursor="pointer"
        display="flex"
        justifyContent="center"
        alignItems="center"
        {...props}
      />
    )
  },
)
const IllustrationContainer = styled('div', {
  platform: 'web',
  base: 'flex w-full rounded-[16px] border border-surface3 overflow-hidden',
})
const Illustration = styled('img', {
  platform: 'web',
  base: 'w-full [transition:transform_ease-in-out_250ms] group-hover:[transform:scale(1.1)]',
})
const Card = styled('div', {
  platform: 'web',
  base: 'group flex flex-col cursor-pointer',
})

function ModalContent({
  header,
  title,
  subtext,
  children,
  logo,
  ...rest
}: PropsWithChildren<{
  title: string
  subtext?: string
  logo?: ReactNode
  header?: ReactNode
}> &
  FlexProps) {
  return (
    <Flex alignItems="center" gap="$spacing32" {...rest}>
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
        <Text variant="body2" fontWeight="$medium">
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
      <TroubleLoggingInModule />
    </ModalContent>
  )
}

enum Page {
  // oxlint-disable-next-line no-shadow
  DownloadApps = 0,
  // oxlint-disable-next-line no-shadow
  DownloadMobile = 1,
}

function DownloadApps({ setPage }: { setPage: (page: Page) => void }) {
  const { t } = useTranslation()
  const account = useAccount()

  return (
    <Trace logImpression modal={ModalName.DownloadApp} properties={{ connector_id: account.connector?.id }}>
      <ModalContent
        title={t('downloadApp.modal.getTheApp.title')}
        subtext={t('downloadApp.modal.uniswapProducts.subtitle')}
        header={<Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />}
        maxWidth="620px"
      >
        <Flex row gap="$spacing12" width="100%" alignItems="flex-start">
          <Card style={{ flex: '1 1 auto' }} onClick={() => setPage(Page.DownloadMobile)}>
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
                    <AppleLogo color="$neutral1" size="$icon.24" />
                  </WiggleIcon>
                  <WiggleIcon>
                    <AndroidLogo color="$neutral1" size="$icon.24" />
                  </WiggleIcon>
                </Flex>
              </Trace>
            </CardInfo>
          </Card>
          <Trace logPress element={ElementName.ExtensionDownloadButton}>
            <Card onClick={() => window.open(UniswapStaticUrls.chromeExtension)}>
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

export function DownloadAppsModal({
  goBack,
  onClose,
  initialInnerPage,
}: {
  goBack?: () => void
  onClose: () => void
  initialInnerPage?: 'mobile'
}) {
  const [page, setPage] = useState<Page>(initialInnerPage === 'mobile' ? Page.DownloadMobile : Page.DownloadApps)

  useEffect(() => {
    setPage(initialInnerPage === 'mobile' ? Page.DownloadMobile : Page.DownloadApps)
  }, [initialInnerPage])

  const showBackButton = !initialInnerPage && (goBack || page !== Page.DownloadApps)

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
        width="100%"
        justifyContent={showBackButton ? 'space-between' : 'flex-end'}
        zIndex={zIndexes.modal}
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
