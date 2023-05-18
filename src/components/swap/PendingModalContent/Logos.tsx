import { Currency } from '@uniswap/sdk-core'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import AnimatedConfirmation from 'components/TransactionConfirmationModal/AnimatedConfirmation'
import styled, { css, keyframes } from 'styled-components/macro'

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
    <CurrencyLoaderContainer asBadge={asBadge} $visible={visible}>
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

export const LoadingIndicatorOverlay = styled(LoaderV3)`
  stroke: ${({ theme }) => theme.textTertiary};
  fill: ${({ theme }) => theme.textTertiary};
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
`

const scaleIn = keyframes`
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`
const scaleInAnimation = css`
  animation: ${scaleIn} ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

export const AnimatedEntranceConfirmationIcon = styled(AnimatedConfirmation)`
  ${scaleInAnimation}
  height: 48px;
  width: 48px;
`
