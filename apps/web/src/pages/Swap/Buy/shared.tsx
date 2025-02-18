import { useTheme } from 'lib/styled-components'
import { PropsWithChildren } from 'react'
import { ArrowLeft } from 'react-feather'
import { Flex, ModalCloseIcon, styled, useSporeColors } from 'ui/src'
import { ReactComponent as ForConnectingBackground } from 'ui/src/assets/backgrounds/for-connecting-v2.svg'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

export const ContentWrapper = styled(Flex, {
  backgroundColor: '$surface1',
  width: '100%',
  flex: 1,
  position: 'relative',
})

const ConnectingBackgroundImage = styled(ForConnectingBackground, {
  position: 'absolute',
  zIndex: 0,
  width: '100%',
  height: '100%',
})

const ConnectingBackgroundImageFadeLayer = styled(Flex, {
  position: 'absolute',
  zIndex: 1,
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
})

interface ConnectingViewWrapperProps {
  closeModal: () => void
  onBack?: () => void
}

export function ConnectingViewWrapper({ children, closeModal, onBack }: PropsWithChildren<ConnectingViewWrapperProps>) {
  const theme = useTheme()
  const colors = useSporeColors()

  return (
    <Flex gap="$spacing16" position="relative" $sm={{ px: '$spacing8', pb: '$spacing16' }}>
      <ConnectingBackgroundImage color={theme.neutral2} />
      <ConnectingBackgroundImageFadeLayer
        background={`radial-gradient(70% 50% at center, transparent 0%, ${colors.surface1.val} 100%)`}
      />
      <Flex flexDirection="row-reverse" alignItems="center" justifyContent="space-between" zIndex={2}>
        <ModalCloseIcon testId="ConnectingViewWrapper-close" onClose={closeModal} />
        {onBack && (
          <ArrowLeft data-testid="ConnectingViewWrapper-back" fill={theme.neutral2} onClick={onBack} cursor="pointer" />
        )}
      </Flex>
      <Flex mt="$spacing40" zIndex={2} width="100%" height="100%">
        {children}
      </Flex>
    </Flex>
  )
}

export function formatFiatOnRampFiatAmount(amount: number, fiatCurrencyInfo: FiatCurrencyInfo) {
  return fiatCurrencyInfo.symbolAtFront ? `${fiatCurrencyInfo.symbol}${amount}` : `${amount}${fiatCurrencyInfo.symbol}`
}
