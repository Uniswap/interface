import { Trans } from '@lingui/macro'
import { L1_CHAIN_IDS, LAYER_TWO_HELP_CENTER_LINK, SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback } from 'react'
import { X } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useDarkModeManager, useLayerTwoSwapAlert } from 'state/user/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import { WrapperBackgroundDarkMode, WrapperBackgroundLightMode } from './styled'

const RootWrapper = styled.div`
  position: relative;
`
const ContentWrapper = styled.div<{ darkMode: boolean; thin?: boolean }>`
  ${({ darkMode }) => (darkMode ? WrapperBackgroundDarkMode : WrapperBackgroundLightMode)};
  display: flex;
  flex-direction: ${({ thin }) => (thin ? 'row' : 'column')};
  position: relative;
  max-width: ${({ thin }) => (thin ? '100%' : '480px')};
  min-height: ${({ thin }) => (thin ? 'min-content' : '174px')};
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  ${({ thin }) =>
    thin &&
    css`
      justify-content: space-between;
      ${CloseIcon} {
        top: 50%;
        margin-top: -12px;
        right: 8px;
      }
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
  margin: 20px 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    grid-gap: 8px;
  }
`
const Header = styled.h2<{ thin?: boolean }>`
  grid-column: 1 / 3;
  display: ${({ thin }) => (thin ? 'none' : 'block')};
  font-weight: 600;
  font-size: 20px;
  padding-right: 30px;
  margin: 0;
`
const Body = styled.p`
  grid-column: 1 / 3;
  font-size: 12px;
  line-height: 143%;
  margin: 0;
`
export const Controls = styled.div<{ thin?: boolean }>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  ${({ thin }) =>
    thin &&
    css`
      margin: auto 40px auto 0;
    `}
`
const NetworkSelectorLink = styled.div<{ thin?: boolean }>`
  display: flex;
  align-items: center;
  height: ${({ thin }) => (thin ? 'auto' : '44px')};
  color: white;
  background-color: black;
  border-radius: 8px;
  padding: ${({ thin }) => (thin ? '8px 12px' : '12px 16px')};
  margin: ${({ thin }) => (thin ? 'auto 10px auto 0' : '0 12px 20px 18px')};
  white-space: nowrap;
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
    `}
`
const LearnMoreLink = styled(ExternalLink)<{ thin?: boolean }>`
  display: flex;
  align-items: center;
  height: ${({ thin }) => (thin ? 'auto' : '44px')};
  background-color: transparent;
  color: ${({ theme }) => theme.text1};
  padding: ${({ thin }) => (thin ? '8px 12px' : '12px 16px')};
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  margin: ${({ thin }) => (thin ? 'auto' : '0 0 20px 0')};
  white-space: nowrap;
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
    `}
`

interface LayerTwoSwapPromotionProps {
  thin?: boolean
}

export function LayerTwoSwapPromotion(props: LayerTwoSwapPromotionProps) {
  const { thin } = props
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [layerTwoInfoAcknowledged, setLayerTwoInfoAcknowledged] = useLayerTwoSwapAlert()
  const isPolygon = chainId && [SupportedChainId.POLYGON, SupportedChainId.POLYGON_MUMBAI].includes(chainId)
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  const toggleChain = useCallback(() => {
    toggle()
  }, [toggle])

  const dismiss = useCallback(() => {
    setLayerTwoInfoAcknowledged(true)
  }, [setLayerTwoInfoAcknowledged])

  if (!chainId || !L1_CHAIN_IDS.includes(chainId) || isPolygon || layerTwoInfoAcknowledged) {
    return null
  }
  const helpCenterLink = LAYER_TWO_HELP_CENTER_LINK
  return (
    <RootWrapper>
      <ContentWrapper darkMode={darkMode} thin={thin}>
        <CloseIcon onClick={dismiss} />
        <BodyText>
          <Header thin={thin}>
            <Trans>Swap on Layer 2</Trans>
          </Header>
          <Body>
            <Trans>
              Enjoy 10x cheaper fees on L2 networks. Learn more about the benefits and risks before you start.
            </Trans>
          </Body>
        </BodyText>
        <Controls thin={thin}>
          <NetworkSelectorLink onClick={toggleChain} thin={thin}>
            <Trans>Switch to L2</Trans>
          </NetworkSelectorLink>
          <LearnMoreLink href={helpCenterLink} thin={thin}>
            <Trans>Learn More</Trans>
          </LearnMoreLink>
        </Controls>
      </ContentWrapper>
    </RootWrapper>
  )
}
