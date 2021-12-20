import { Trans } from '@lingui/macro'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useDarkModeManager } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled, { css } from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

import { CHAIN_INFO } from '../../constants/chains'

export const DesktopTextBreak = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`

const L2Icon = styled.img`
  width: 36px;
  height: 36px;
  justify-self: center;
`
const BetaTag = styled.span<{ color: string }>`
  align-items: center;
  background-color: ${({ color }) => color};
  border-radius: 6px;
  color: ${({ theme }) => theme.white};
  display: flex;
  font-size: 14px;
  height: 28px;
  justify-content: center;
  left: -16px;
  position: absolute;
  transform: rotate(-15deg);
  top: -16px;
  width: 60px;
  z-index: 1;
`
const Body = styled.p`
  font-size: 12px;
  grid-column: 1 / 3;
  line-height: 143%;
  margin: 0;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-column: 2 / 3;
  }
`
export const Controls = styled.div<{ thin?: boolean }>`
  align-items: center;
  display: flex;
  justify-content: flex-start;
  ${({ thin }) =>
    thin &&
    css`
      margin: auto 32px auto 0;
    `}
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`
const BodyText = styled.div`
  align-items: center;
  display: grid;
  grid-gap: 4px;
  grid-template-columns: 40px 4fr;
  grid-template-rows: auto auto;
  margin: 20px 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-template-columns: 42px 4fr;
    grid-gap: 8px;
  }
`

const RootWrapper = styled.div`
  position: relative;
`

const ContentWrapper = styled.div<{ chainId: SupportedChainId; darkMode: boolean; logoUrl: string; thin?: boolean }>`
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  min-height: 174px;
  overflow: hidden;
  position: relative;
  width: 100%;
  ${({ thin }) =>
    thin &&
    css`
      flex-direction: row;
      max-width: max-content;
      min-height: min-content;
    `}
  :before {
    background-image: url(${({ logoUrl }) => logoUrl});
    background-repeat: no-repeat;
    background-size: 300px;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -40px);
    width: 300px;
    z-index: -1;
  }
`
const Header = styled.h2<{ thin?: boolean }>`
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  padding-right: 30px;
  display: ${({ thin }) => (thin ? 'none' : 'block')};
`

interface NetworkAlertProps {
  thin?: boolean
}

export function NetworkAlert(props: NetworkAlertProps) {
  const { account, chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [locallyDismissed, setLocallyDimissed] = useState(false)
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']

  const dismiss = useCallback(() => {
    if (!userEthBalance?.greaterThan(0)) {
      setLocallyDimissed(true)
    }
  }, [userEthBalance])

  if (!chainId || locallyDismissed) {
    return null
  }
  const info = CHAIN_INFO[chainId]
  const showCloseIcon = Boolean(userEthBalance?.greaterThan(0) && !props.thin)
  return (
    <RootWrapper>
      <BetaTag color="#0490ed">Beta</BetaTag>
      <ContentWrapper chainId={chainId} darkMode={darkMode} logoUrl={info.logoUrl || ''} thin={props.thin}>
        {showCloseIcon && <CloseIcon onClick={dismiss} />}
        <BodyText>
          <L2Icon src={info.logoUrl} />
          <Header thin={props.thin}>
            <Trans>Uniswap on {info.label}</Trans>
          </Header>
          <Body>
            <Trans>
              To start trading on {info.label}, first bridge your assets from L1 to L2. Please treat this as a beta
              release and learn about the risks before using {info.label}.
            </Trans>
          </Body>
        </BodyText>
      </ContentWrapper>
    </RootWrapper>
  )
}
