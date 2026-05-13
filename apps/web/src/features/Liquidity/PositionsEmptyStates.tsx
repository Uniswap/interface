import { useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Pools } from 'ui/src/components/icons/Pools'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import PROVIDE_LIQUIDITY from '~/assets/images/provideLiquidity.png'
import V4_HOOK from '~/assets/images/v4Hooks.png'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const BUTTON_AREA_WIDTH = 160 * 2

export function DisconnectedWalletView() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()
  const connectedWithoutEVM = useIsMissingPlatformWallet(Platform.EVM)

  const handleConnectWallet = () => {
    if (connectedWithoutEVM) {
      setMenu({ variant: MenuStateVariant.CONNECT_PLATFORM, platform: Platform.EVM })
    }
    accountDrawer.open()
  }

  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Wallet size="$icon.24" color="$neutral1" />
        </Flex>
        <Flex gap="$gap4" centered>
          <Text variant="subheading1">
            {connectedWithoutEVM ? t('pool.notAvailableOnSolana') : t('positions.welcome.connect.wallet')}
          </Text>
          <Text variant="body2" color="$neutral2">
            {connectedWithoutEVM ? t('pool.connectEthereumToView') : t('positions.welcome.connect.description')}
          </Text>
        </Flex>
        <Flex row gap="$gap8" $md={{ flexDirection: 'column', width: '100%' }} width={BUTTON_AREA_WIDTH}>
          {!connectedWithoutEVM && (
            <Button
              $md={{
                py: '$spacing16',
              }}
              variant="default"
              size="small"
              emphasis="secondary"
              tag="a"
              href="/positions/create/v4"
              $platform-web={{
                textDecoration: 'none',
              }}
            >
              {t('position.new')}
            </Button>
          )}
          <Button
            $md={{
              py: '$spacing16',
            }}
            variant="default"
            size="small"
            borderRadius="$rounded12"
            onPress={handleConnectWallet}
          >
            {connectedWithoutEVM ? t('common.connectAWallet.button.evm') : t('common.connectWallet.button')}
          </Button>
        </Flex>
      </Flex>
      <Flex gap="$gap20" mb="$spacing24">
        <Flex row gap="$gap12" $sm={{ flexDirection: 'column' }}>
          <LearnMoreTile
            width="100%"
            img={PROVIDE_LIQUIDITY}
            text={t('liquidity.provideOnProtocols')}
            link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
          />
          <LearnMoreTile
            width="100%"
            img={V4_HOOK}
            text={t('liquidity.hooks')}
            link={uniswapUrls.helpArticleUrls.v4HooksInfo}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export function EmptyPositionsView() {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        $platform-web={{
          textAlign: 'center',
        }}
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Pools size="$icon.24" color="$neutral1" />
        </Flex>
        <Text variant="subheading1">{t('positions.noPositions.title')}</Text>
        <Text variant="body2" color="$neutral2" maxWidth={420}>
          {t('positions.noPositions.description')}
        </Text>
        <Flex row gap="$gap8" $md={{ flexDirection: 'column', width: '100%' }} width={BUTTON_AREA_WIDTH}>
          <Button
            $md={{
              py: '$spacing16',
            }}
            variant="default"
            size="small"
            emphasis="secondary"
            tag="a"
            href="/explore/pools"
            $platform-web={{
              textDecoration: 'none',
            }}
          >
            {t('pools.explore')}
          </Button>
          <Button
            $md={{
              py: '$spacing16',
            }}
            variant="default"
            size="small"
            tag="a"
            href="/positions/create/v4"
            $platform-web={{
              textDecoration: 'none',
            }}
          >
            {t('position.new')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function ErrorPositionsView({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        $platform-web={{
          textAlign: 'center',
        }}
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$statusCritical2">
          <AlertTriangleFilled size="$icon.24" color="$statusCritical" />
        </Flex>
        <Text variant="subheading1">{t('common.error.general')}</Text>
        <Text variant="body2" color="$neutral2" maxWidth={420}>
          {t('positions.error.loading')}
        </Text>
        <Button variant="default" size="small" onPress={onRetry}>
          {t('common.button.retry')}
        </Button>
      </Flex>
    </Flex>
  )
}

export function LearnMoreTile({
  img,
  text,
  link,
  width = 344,
}: {
  img: string
  text: string
  link?: string
  width?: number | string
}) {
  return (
    <Anchor
      href={link}
      textDecorationLine="none"
      target="_blank"
      rel="noopener noreferrer"
      width={width}
      {...ClickableTamaguiStyle}
      hoverStyle={{ backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' }}
    >
      <Flex
        row
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        alignItems="center"
        gap="$gap16"
        overflow="hidden"
      >
        <img src={img} style={{ objectFit: 'cover', width: '72px', height: '72px' }} />
        <Text variant="subheading2">{text}</Text>
      </Flex>
    </Anchor>
  )
}
