import { Currency } from '@thinkincoin-libs/sdk-core'
import { ReactComponent as PapersIcon } from 'assets/svg/papers-text.svg'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { useUnmountingAnimation } from 'hooks/useUnmountingAnimation'
import { useRef } from 'react'
import styled, { css, keyframes, useTheme } from 'styled-components/macro'

export const LogoContainer = styled.div`
  height: 48px;
  width: 48px;
  position: relative;
  display: flex;
  border-radius: 50%;
  overflow: visible;
`

const fadeIn = keyframes`
  from { opacity: 0;}
  to { opacity: 1;}
`
const fadeAndScaleIn = keyframes`
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
`
const fadeInAnimation = css`
  animation: ${fadeIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`
const fadeAndScaleInAnimation = css`
  animation: ${fadeAndScaleIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0;  }
`
const fadeAndScaleOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0); }
`
const fadeOutAnimation = css`
  animation: ${fadeOut} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`
const fadeAndScaleOutAnimation = css`
  animation: ${fadeAndScaleOut} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

export enum AnimationType {
  EXITING = 'exiting',
}

const FadeWrapper = styled.div<{ $scale: boolean }>`
  transition: display ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`},
    transform ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  ${({ $scale }) => ($scale ? fadeAndScaleInAnimation : fadeInAnimation)}

  &.${AnimationType.EXITING} {
    ${({ $scale }) => ($scale ? fadeAndScaleOutAnimation : fadeOutAnimation)}
  }
`

function FadePresence({
  children,
  className,
  $scale = false,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  $scale?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useUnmountingAnimation(ref, () => AnimationType.EXITING)
  return (
    <FadeWrapper ref={ref} className={className} $scale={$scale} {...rest}>
      {children}
    </FadeWrapper>
  )
}

const CurrencyLoaderContainer = styled(FadePresence)<{ asBadge: boolean }>`
  z-index: 2;
  border-radius: 50%;
  transition: all ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  position: absolute;
  height: ${({ asBadge }) => (asBadge ? '20px' : '100%')};
  width: ${({ asBadge }) => (asBadge ? '20px' : '100%')};
  bottom: ${({ asBadge }) => (asBadge ? '-4px' : 0)};
  right: ${({ asBadge }) => (asBadge ? '-4px' : 0)};
  outline: ${({ theme, asBadge }) => (asBadge ? `2px solid ${theme.background}` : '')};
`

const RaisedCurrencyLogo = styled(CurrencyLogo)`
  z-index: 1;
`

export function CurrencyLoader({ currency, asBadge = false }: { currency?: Currency; asBadge?: boolean }) {
  return (
    <CurrencyLoaderContainer asBadge={asBadge} data-testid={`pending-modal-currency-logo-${currency?.symbol}`}>
      <RaisedCurrencyLogo currency={currency} size="100%" />
    </CurrencyLoaderContainer>
  )
}

const PinkCircle = styled(FadePresence)`
  position: absolute;
  display: flex;
  height: 100%;
  width: 100%;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.userThemeColor};
  z-index: 1;
`

export function PaperIcon() {
  return (
    <PinkCircle>
      <PapersIcon />
    </PinkCircle>
  )
}

const LoadingIndicator = styled(LoaderV3)`
  stroke: ${({ theme }) => theme.textTertiary};
  fill: ${({ theme }) => theme.textTertiary};
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
`

export function LoadingIndicatorOverlay() {
  return (
    <FadePresence>
      <LoadingIndicator />
    </FadePresence>
  )
}

function ConfirmedIcon({ className }: { className?: string }) {
  const theme = useTheme()
  return (
    <FadePresence $scale>
      <svg
        data-testid="confirmed-icon"
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
    </FadePresence>
  )
}

export const AnimatedEntranceConfirmationIcon = styled(ConfirmedIcon)`
  height: 48px;
  width: 48px;
`
