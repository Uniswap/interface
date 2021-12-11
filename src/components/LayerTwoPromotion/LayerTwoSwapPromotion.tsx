import { Trans } from '@lingui/macro'
import { L1_CHAIN_IDS, LAYER_TWO_HELP_CENTER_LINK } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useDarkModeManager, useLayerTwoSwapAlert } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

export const DesktopTextBreak = styled.div`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`

const Body = styled.p`
  font-size: 12px;
  grid-column: 1 / 3;
  line-height: 143%;
  margin: 0;
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
const LearnMoreLink = styled(ExternalLink)<{ thin?: boolean }>`
  align-items: center;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  color: ${({ theme }) => theme.text1};
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  margin: 0 0 20px 0;
  padding: 12px 16px;
  text-decoration: none;
  width: auto;
  :hover,
  :focus,
  :active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  transition: background-color 150ms ease-in-out;
  ${({ thin }) =>
    thin &&
    css`
      font-size: 14px;
      margin: auto;
      width: 112px;
    `}
`
const RootWrapper = styled.div`
  position: relative;
`
export const WrapperBackgroundDarkMode = css`
  background: radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%),
    radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.5) 0%, rgba(235, 0, 255, 0.345) 96%);
`
export const WrapperBackgroundLightMode = css`
  background: radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),
    radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.5);
`
const ContentWrapper = styled.div<{ darkMode: boolean; thin?: boolean }>`
  ${({ darkMode }) => (darkMode ? WrapperBackgroundDarkMode : WrapperBackgroundLightMode)};
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
`
const Header = styled.h2<{ thin?: boolean }>`
  grid-column: 1 / 3;
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  padding-right: 30px;
  display: ${({ thin }) => (thin ? 'none' : 'block')};
`
const NetworkSelectorLink = styled.div<{ thin?: boolean }>`
  align-items: center;
  background-color: black;
  border-radius: 8px;
  color: white;
  display: flex;
  font-size: 16px;
  height: 44px;
  justify-content: space-between;
  margin: 0 12px 20px 18px;
  padding: 12px 16px;
  text-decoration: none;
  width: auto;
  cursor: pointer;
  :hover,
  :focus,
  :active {
    background-color: black;
    text-decoration: underline;
  }
  ${({ thin }) =>
    thin &&
    css`
      font-size: 14px;
      margin: auto 10px;
      width: 168px;
    `}
`

interface LayerTwoSwapPromotionProps {
  thin?: boolean
}

export function LayerTwoSwapPromotion(props: LayerTwoSwapPromotionProps) {
  const { account, chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [layerTwoInfoAcknowledged, setLayerTwoInfoAcknowledged] = useLayerTwoSwapAlert()
  const [locallyDismissed, setLocallyDimissed] = useState(false)
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  const toggleChain = useCallback(() => {
    toggle()
  }, [toggle])

  const dismiss = useCallback(() => {
    setLocallyDimissed(true)
  }, [chainId, setLayerTwoInfoAcknowledged, userEthBalance])

  if (!chainId || !L1_CHAIN_IDS.includes(chainId) || locallyDismissed) {
    return null
  }
  const helpCenterLink = LAYER_TWO_HELP_CENTER_LINK
  const showCloseIcon = Boolean(userEthBalance?.greaterThan(0) && !props.thin)
  return (
    <RootWrapper>
      <ContentWrapper darkMode={darkMode} thin={props.thin}>
        {showCloseIcon && <CloseIcon onClick={dismiss} />}
        <BodyText>
          <Header thin={props.thin}>
            <Trans>Swap on Layer 2</Trans>
          </Header>
          <Body>
            <Trans>
              Enjoy 10x cheaper fees on L2 networks. Learn more about the benefits and risks before you start.
            </Trans>
          </Body>
        </BodyText>
        <Controls thin={props.thin}>
          <NetworkSelectorLink onClick={toggleChain} thin={props.thin}>
            <Trans>Switch to L2</Trans>
          </NetworkSelectorLink>
          <LearnMoreLink href={helpCenterLink} thin={props.thin}>
            <Trans>Learn More</Trans>
          </LearnMoreLink>
        </Controls>
      </ContentWrapper>
    </RootWrapper>
  )
}
