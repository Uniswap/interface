import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import styled, { useTheme } from 'lib/styled-components'
import { BackArrowIcon } from 'nft/components/icons'
import { PropsWithChildren } from 'react'
import { CloseIcon } from 'theme/components'
import { ReactComponent as ForConnectingBackground } from 'ui/src/assets/backgrounds/for-connecting-v2.svg'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

export const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  overflow: hidden;
  flex: 1 1;
  position: relative;
`

const ConnectingContainer = styled(AutoColumn)`
  position: relative;
`

const ConnectingBackgroundImage = styled(ForConnectingBackground)`
  position: absolute;
  z-index: 0;
`

const ConnectingBackgroundImageFadeLayer = styled.div`
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  ${({ theme }) => `background: radial-gradient(70% 50% at center, transparent 0%, ${theme.surface1} 100%)`}
`

const ConnectingViewContent = styled.div`
  margin: 40px 0 0 0;
  z-index: 2;
  height: 100%;
  width: 100%;
`

const BackButton = styled(BackArrowIcon)`
  cursor: pointer;
`

const ConnectingViewHeader = styled(Row)`
  align-items: center;
  justify-content: space-between;
  z-index: 2;
  flex-direction: row-reverse;
`

interface ConnectingViewWrapperProps {
  closeModal: () => void
  onBack?: () => void
}

export function ConnectingViewWrapper({ children, closeModal, onBack }: PropsWithChildren<ConnectingViewWrapperProps>) {
  const theme = useTheme()

  return (
    <ConnectingContainer gap="16px">
      <ConnectingBackgroundImage color={theme.neutral2} />
      <ConnectingBackgroundImageFadeLayer />
      <ConnectingViewHeader>
        <CloseIcon data-testid="ConnectingViewWrapper-close" onClick={closeModal} $color={theme.neutral2} />
        {onBack && <BackButton data-testid="ConnectingViewWrapper-back" fill={theme.neutral2} onClick={onBack} />}
      </ConnectingViewHeader>
      <ConnectingViewContent>{children}</ConnectingViewContent>
    </ConnectingContainer>
  )
}

export function formatFiatOnRampFiatAmount(amount: number, fiatCurrencyInfo: FiatCurrencyInfo) {
  return fiatCurrencyInfo.symbolAtFront ? `${fiatCurrencyInfo.symbol}${amount}` : `${amount}${fiatCurrencyInfo.symbol}`
}
