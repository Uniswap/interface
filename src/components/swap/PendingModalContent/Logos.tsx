import { Currency } from '@uniswap/sdk-core'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import styled, { useTheme } from 'styled-components/macro'

import { ReactComponent as PapersIcon } from '../../../assets/svg/papers-text.svg'

export const LogoContainer = styled.div`
  height: 48px;
  width: 48px;
  position: relative;
  display: flex;
  border-radius: 50%;
  overflow: visible;
`

const CurrencyLoaderContainer = styled.div<{ $visible: boolean; asBadge: boolean }>`
  z-index: 2;
  border-radius: 50%;
  transition: all ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  position: absolute;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  height: ${({ asBadge }) => (asBadge ? '20px' : '100%')};
  width: ${({ asBadge }) => (asBadge ? '20px' : '100%')};
  bottom: ${({ asBadge }) => (asBadge ? '-4px' : 0)};
  right: ${({ asBadge }) => (asBadge ? '-4px' : 0)};
  outline: ${({ theme, asBadge }) => (asBadge ? `2px solid ${theme.background}` : '')};
`

const RaisedCurrencyLogo = styled(CurrencyLogo)`
  z-index: 1;
`

export function CurrencyLoader({
  visible,
  currency,
  asBadge = false,
}: {
  visible: boolean
  currency: Currency | undefined
  asBadge?: boolean
}) {
  return (
    <CurrencyLoaderContainer
      asBadge={asBadge}
      $visible={visible}
      data-testid={`pending-modal-currency-logo-${currency?.symbol}`}
    >
      <RaisedCurrencyLogo currency={currency} size="100%" />
    </CurrencyLoaderContainer>
  )
}

const PinkCircle = styled.div<{ $visible: boolean }>`
  position: absolute;
  display: flex;
  height: 100%;
  width: 100%;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.userThemeColor};
  z-index: 1;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

export function PaperIcon({ visible }: { visible: boolean }) {
  return (
    <>
      <PinkCircle $visible={visible}>
        <PapersIcon />
      </PinkCircle>
    </>
  )
}

export const LoadingIndicatorOverlay = styled(LoaderV3)<{ visible: boolean }>`
  stroke: ${({ theme }) => theme.textTertiary};
  fill: ${({ theme }) => theme.textTertiary};
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transform: ${({ visible }) => (visible ? 'scale(1)' : 'scale(0)')};
  transition: opacity ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`},
    transform ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

function ConfirmedIcon({ className }: { className?: string }) {
  const theme = useTheme()
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M27 0.333008C12.28 0.333008 0.333313 12.2797 0.333313 26.9997C0.333313 41.7197 12.28 53.6663 27 53.6663C41.72 53.6663 53.6666 41.7197 53.6666 26.9997C53.6666 12.2797 41.72 0.333008 27 0.333008ZM37.7466 22.1997L25.2933 34.6263C24.9199 35.0263 24.4133 35.2131 23.8799 35.2131C23.3733 35.2131 22.8666 35.0263 22.4666 34.6263L16.2533 28.4131C15.48 27.6398 15.48 26.3596 16.2533 25.5863C17.0266 24.8129 18.3066 24.8129 19.08 25.5863L23.8799 30.3864L34.92 19.373C35.6933 18.573 36.9733 18.573 37.7466 19.373C38.52 20.1464 38.52 21.3997 37.7466 22.1997Z"
        fill={theme.accentSuccess}
      />
    </svg>
  )
}

export const AnimatedEntranceConfirmationIcon = styled(ConfirmedIcon)<{ visible: boolean }>`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transform: ${({ visible }) => (visible ? 'scale(1)' : 'scale(0)')};
  transition: opacity ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`},
    transform ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  height: 48px;
  width: 48px;
`
