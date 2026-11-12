import { Button, type ButtonProps, Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { Droplet } from '@universe/mycelium/icons/Droplet'
import { Plus } from '@universe/mycelium/icons/Plus'
import { useMedia, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { heights } from '@universe/mycelium/tokens'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { LaunchTokenModal } from '~/features/Liquidity/LaunchTokenModal'
import { PoolAreaLayout } from '~/features/Liquidity/PoolAreaLayout'
import { createDottedBackgroundStyles } from '~/utils/createDottedBackgroundStyles'
import { ADD_LIQUIDITY_PATH, CREATE_POOL_PATH } from '~/utils/params/poolLinkParams'

const fillAbsolute: FlexCompatProps = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }

const dotsFadeMask = 'linear-gradient(to bottom, black 0%, transparent 80%)'

const linkButtonProps: ButtonProps = {
  tag: 'a',
  variant: 'branded',
  size: 'medium',
  fill: false,
  '$platform-web': { textDecoration: 'none' },
}

export function PoolAreaHeroHeader({
  // TODO(CONS-3926): Remove the legacy layout and Positions branches when hooks_explore_ux is retired.
  legacyLayout = false,
  hideContentOnMobile = false,
}: {
  legacyLayout?: boolean
  hideContentOnMobile?: boolean
} = {}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const media = useMedia()
  const [isLaunchTokenModalOpen, setIsLaunchTokenModalOpen] = useState(false)

  const { dottedBackgroundStyle } = createDottedBackgroundStyles({ dotColor: colors.neutral1.val, dotOpacity: 12 })

  return (
    <Flex minWidth="100vw" mt={-heights['interface-nav']} position="relative" overflow="hidden" alignItems="center">
      <Flex
        {...fillAbsolute}
        style={{ ...dottedBackgroundStyle, maskImage: dotsFadeMask, WebkitMaskImage: dotsFadeMask }}
      />
      <PoolAreaLayout zIndex={1} pt={heights['interface-nav']} px={legacyLayout ? '$spacing40' : '$none'}>
        <Flex
          gap="$spacing36"
          py={legacyLayout ? '$spacing32' : '$spacing24'}
          $md={{ alignItems: 'center', display: hideContentOnMobile ? 'none' : undefined }}
        >
          <Flex gap="$spacing8" maxWidth={480} $md={{ alignItems: 'center' }}>
            <Text variant="heading2" color="$neutral1" $md={{ textAlign: 'center' }}>
              {t('pool.hero.title')}
            </Text>
            <Text variant="subheading1" color="$neutral2" $md={{ textAlign: 'center' }}>
              {t('pool.hero.subtitle')}
            </Text>
          </Flex>
          <Flex row gap="$spacing8" flexWrap="wrap" $md={{ justifyContent: 'center' }}>
            <Trace logPress element={ElementName.CreatePositionButton}>
              <Button {...linkButtonProps} emphasis="primary" href={ADD_LIQUIDITY_PATH} icon={<Droplet />}>
                {t('common.createPosition')}
              </Button>
            </Trace>
            <Trace logPress element={ElementName.CreatePoolButton}>
              <Button {...linkButtonProps} emphasis="secondary" href={CREATE_POOL_PATH} icon={<Plus />}>
                {t('addLiquidity.createPool')}
              </Button>
            </Trace>
            {!media.md && (
              <Trace logPress element={ElementName.LaunchTokenButton}>
                <Button
                  variant="branded"
                  size="medium"
                  fill={false}
                  emphasis="secondary"
                  icon={<Plus />}
                  onPress={() => setIsLaunchTokenModalOpen(true)}
                >
                  {t('toucan.createAuction.launchToken')}
                </Button>
              </Trace>
            )}
          </Flex>
        </Flex>
      </PoolAreaLayout>
      <LaunchTokenModal isOpen={isLaunchTokenModalOpen} onClose={() => setIsLaunchTokenModalOpen(false)} />
    </Flex>
  )
}
