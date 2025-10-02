import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { Flex, IconButton, styled, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { SOLANA_BANNER_DARK, SOLANA_BANNER_LIGHT, SOLANA_LOGO } from 'ui/src/assets'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export const SOLANA_PROMO_BANNER_STORAGE_KEY = 'solanaPromoHidden'

const SOLANA_PROMO_BANNER_HEIGHT = 134
const SOLANA_GRADIENT_BACKGROUND_HEIGHT = 64

const BannerContainer = styled(TouchableArea, {
  borderRadius: '$rounded16',
  width: 260,
  height: SOLANA_PROMO_BANNER_HEIGHT,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  overflow: 'hidden',
  padding: '$spacing16',
  backgroundColor: '$surface1',

  '$platform-web': {
    position: 'fixed',
    bottom: 29,
    left: 40,
  },
})

const SolanaGradientBackground = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,

  width: '100%',
  height: SOLANA_GRADIENT_BACKGROUND_HEIGHT,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',

  // Apply an opacity mask to create a fade effect from top to bottom
  // Top is less transparent (54% visible), bottom is more transparent (12% visible)
  mask: 'linear-gradient(180deg, rgba(0,0,0,0.54) 0%, rgba(0,0,0,0.12) 100%)',
})

const IconContainer = styled(Flex, {
  width: 40,
  height: 40,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '$rounded6',

  marginTop: '$spacing16',
})

export function SolanaPromoBanner() {
  const dispatch = useAppDispatch()

  const handleBannerClose = useEvent(() => {
    setHidden(true)
    localStorage.setItem(SOLANA_PROMO_BANNER_STORAGE_KEY, 'true')
  })

  const openSolanaPromoModal = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.SolanaPromo }))

    handleBannerClose()
  })

  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const hasSeenBanner = localStorage.getItem(SOLANA_PROMO_BANNER_STORAGE_KEY) === 'true'
    setHidden(hasSeenBanner)
  }, [])

  const isDarkMode = useIsDarkMode()
  const bannerImage = isDarkMode ? SOLANA_BANNER_DARK : SOLANA_BANNER_LIGHT

  if (hidden) {
    return null
  }

  return (
    <BannerContainer onPress={openSolanaPromoModal} zIndex={zIndexes.sticky}>
      <BannerXButton handleClose={handleBannerClose} />
      <SolanaGradientBackground backgroundImage={`url(${bannerImage})`} />

      <Flex gap="$spacing8">
        <IconContainer backgroundImage={`url(${SOLANA_LOGO})`} />
        <SolanaPromoBannerContent />
      </Flex>
    </BannerContainer>
  )
}

function BannerXButton({ handleClose }: { handleClose: () => void }) {
  return (
    <Flex row centered position="absolute" right={8} top={8} zIndex={zIndexes.mask}>
      <IconButton
        size="xxsmall"
        emphasis="secondary"
        onPress={(e) => {
          e.stopPropagation()
          handleClose()
        }}
        icon={<X />}
        p={3}
        scale={0.8}
      />
    </Flex>
  )
}

function SolanaPromoBannerContent() {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing4">
      <Text variant="body3" color="$neutral1">
        {t('solanaPromo.banner.title')}
      </Text>
      <Text variant="body4" color="$neutral2">
        {t('solanaPromo.banner.description')}
      </Text>
    </Flex>
  )
}
