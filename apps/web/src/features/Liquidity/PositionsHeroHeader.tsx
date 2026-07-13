import { useTranslation } from 'react-i18next'
import { Button, type ButtonProps, Flex, type FlexProps, Text, useIsDarkMode, useMedia, useSporeColors } from 'ui/src'
import { Droplet } from 'ui/src/components/icons/Droplet'
import { Plus } from 'ui/src/components/icons/Plus'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import flowerImageDark from '~/assets/images/pools-hero-flower-dark.jpg'
import flowerImage from '~/assets/images/pools-hero-flower.jpg'
import { MAX_CONTENT_WIDTH_PX } from '~/theme'
import { createDottedBackgroundStyles } from '~/utils/createDottedBackgroundStyles'

const ADD_LIQUIDITY_HREF = '/positions/add'
const CREATE_POOL_HREF = '/positions/create'
const LAUNCH_AUCTION_HREF = '/liquidity/launch-auction'

const fillAbsolute: FlexProps = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }

const dotsFadeMask = 'linear-gradient(to bottom, black 0%, transparent 80%)'

const linkButtonProps: ButtonProps = {
  tag: 'a',
  variant: 'branded',
  size: 'medium',
  fill: false,
  '$platform-web': { textDecoration: 'none' },
}

export function PositionsHeroHeader() {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()
  const media = useMedia()

  const { dottedBackgroundStyle } = createDottedBackgroundStyles({ dotColor: colors.neutral1.val, dotOpacity: 12 })

  return (
    <Flex minWidth="100vw" mt={-INTERFACE_NAV_HEIGHT} position="relative" overflow="hidden" alignItems="center">
      <Flex
        {...fillAbsolute}
        style={{
          backgroundImage: `url(${isDarkMode ? flowerImageDark : flowerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      />
      <Flex
        {...fillAbsolute}
        style={{ ...dottedBackgroundStyle, maskImage: dotsFadeMask, WebkitMaskImage: dotsFadeMask }}
      />
      <Flex {...fillAbsolute} style={{ background: 'linear-gradient(to bottom, transparent, var(--surface1))' }} />
      <Flex
        width="100%"
        maxWidth={MAX_CONTENT_WIDTH_PX}
        zIndex={1}
        pt={INTERFACE_NAV_HEIGHT}
        px="$spacing40"
        $lg={{ px: '$spacing20' }}
      >
        <Flex gap="$spacing36" py="$spacing32" $md={{ alignItems: 'center' }}>
          <Flex gap="$spacing8" maxWidth={480} $md={{ alignItems: 'center' }}>
            <Text variant="heading2" color="$neutral1" $md={{ textAlign: 'center' }}>
              {t('pool.hero.title')}
            </Text>
            <Text variant="subheading1" color="$neutral2" $md={{ textAlign: 'center' }}>
              {t('pool.hero.subtitle')}
            </Text>
          </Flex>
          <Flex row gap="$spacing8" flexWrap="wrap" $md={{ justifyContent: 'center' }}>
            <Button {...linkButtonProps} emphasis="primary" href={ADD_LIQUIDITY_HREF} icon={<Droplet />}>
              {t('common.addLiquidity')}
            </Button>
            <Button {...linkButtonProps} emphasis="secondary" href={CREATE_POOL_HREF} icon={<Plus />}>
              {t('addLiquidity.createPool')}
            </Button>
            {!media.md && (
              <Button {...linkButtonProps} emphasis="secondary" href={LAUNCH_AUCTION_HREF} icon={<Plus />}>
                {t('toucan.createAuction.launchAuction')}
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
