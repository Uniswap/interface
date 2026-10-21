import { Button, Flex, Text, useIsDarkMode, useSporeColors } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { opacify } from 'ui/src/theme'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT } from '~/pages/Portfolio/constants'
import { MWEB_BOTTOM_INSET } from '~/utils/mwebBottomInset'

function useBackgroundGradient() {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const fadeMaxOpacity = isDarkMode ? 70 : 90
  const gradientColors = {
    0: opacify(fadeMaxOpacity, colors.surface1.val),
    70: opacify(fadeMaxOpacity * (2 / 3), colors.surface1.val),
    80: opacify(fadeMaxOpacity / 2, colors.surface1.val),
    100: opacify(0, colors.surface1.val),
  }
  return `linear-gradient(to top, ${gradientColors[0]} 0%, ${gradientColors[70]} 70%, ${gradientColors[80]} 80%, ${gradientColors[100]} 100%)`
}

// The legacy animation:'300ms' only ever moved opacity and transform, so the transition is
// scoped to them (never `transition: all`).
const VISIBILITY_TRANSITION_STYLE = {
  willChange: 'transform, opacity',
  transition: `transform ${SPORE_ANIMATION_CURVE_CSS['300ms']}, opacity ${SPORE_ANIMATION_CURVE_CSS['300ms']}`,
} as const

const FADE_OVERLAY_VARIANTS = {
  visible: {
    true: 'opacity-[1] [transform:translateY(0px)]',
    false: 'opacity-[0] [transform:translateY(30px)]',
  },
} as const

// z-header sits above the page content but below the sidebar.
const FadeOverlay = styled(Flex, {
  base: 'items-center justify-center w-[100%] z-header fixed bottom-[0px] right-[0px] left-[0px]',
  variants: FADE_OVERLAY_VARIANTS,
  inlineStyle: () => VISIBILITY_TRANSITION_STYLE,
})

const FIXED_BOTTOM_BUTTON_VARIANTS = {
  visible: {
    true: 'opacity-[1] [transform:translateY(0px)_scale(1)]',
    false: 'opacity-[0] [transform:translateY(10px)_scale(0.8)]',
  },
} as const

// The button and the fade behind it both rise by the in-app-browser chrome / safe-area band.
const FixedBottomButton = styled(Flex, {
  base: 'items-center justify-center w-[100%] z-header fixed right-[0px] left-[0px]',
  variants: FIXED_BOTTOM_BUTTON_VARIANTS,
  inlineStyle: () => ({ ...VISIBILITY_TRANSITION_STYLE, bottom: `calc(40px + ${MWEB_BOTTOM_INSET})` }),
})

export function ConnectWalletFixedBottomButton(): JSX.Element {
  const shouldShow = useScrollCompact({})
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()
  const backgroundGradient = useBackgroundGradient()
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is mounted and laid out before animating in
  useEffect(() => {
    if (shouldShow && !isMounted) {
      // Use requestAnimationFrame to ensure layout is calculated before animating
      requestAnimationFrame(() => {
        setIsMounted(true)
      })
    } else if (!shouldShow) {
      setIsMounted(false)
    }
  }, [shouldShow, isMounted])

  // Only show if both shouldShow is true AND component is mounted (prevents choppy initial animation)
  const showAfterMount = shouldShow && isMounted

  return (
    <>
      {/* Bottom fade overlay */}
      <FadeOverlay
        visible={showAfterMount}
        height={`calc(${CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT}px + ${MWEB_BOTTOM_INSET})`}
        background={backgroundGradient}
        cursor="not-allowed"
        pointerEvents={showAfterMount ? 'auto' : 'none'}
      />
      <FixedBottomButton visible={showAfterMount} pointerEvents={showAfterMount ? 'auto' : 'none'}>
        <Flex
          row
          centered
          boxShadow="0 25px 50px -12px rgba(18, 18, 23, 0.25);"
          backgroundColor="$surface1"
          borderRadius="$rounded20"
          p="$spacing16"
          gap="$spacing24"
          cursor="default"
          borderWidth="$spacing1"
          borderColor="$surface3"
        >
          <Text variant="body2" color="$neutral2">
            {t('portfolio.disconnected.connectWallet.cta')}
          </Text>
          <Trace
            logPress
            eventOnTrigger={InterfaceEventName.ConnectWalletButtonClicked}
            element={ElementName.PortfolioConnectWalletBottomButton}
          >
            <Button
              variant="branded"
              size="medium"
              width="fit-content"
              maxHeight="48px"
              margin="auto"
              onPress={accountDrawer.open}
            >
              {t('common.connectWallet.button')}
            </Button>
          </Trace>
        </Flex>
      </FixedBottomButton>
    </>
  )
}
