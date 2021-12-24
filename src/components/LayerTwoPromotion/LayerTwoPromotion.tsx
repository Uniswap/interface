import { Trans } from '@lingui/macro'
import { L1_CHAIN_IDS, LAYER_TWO_HELP_CENTER_LINK, SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback } from 'react'
import { X } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useDarkModeManager, useLayerTwoSwapAlert } from 'state/user/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, HideSmall } from 'theme'

import { WrapperBackgroundDarkMode, WrapperBackgroundLightMode } from './styled'

const RootWrapper = styled.div<{ darkMode: boolean; isSwap?: boolean }>`
  ${({ darkMode }) => (darkMode ? WrapperBackgroundDarkMode : WrapperBackgroundLightMode)};
  position: relative;
  width: 100%;
  color: ${({ theme, darkMode }) => (darkMode ? theme.text1 : theme.primary1)};
  border-radius: ${({ isSwap }) => (isSwap ? '20px' : '12px')};
  margin-top: 16px;
  a {
    color: ${({ theme, darkMode }) => (darkMode ? theme.text1 : theme.primary1)};
  }
`
const CloseIcon = styled(X)<{ isSwap?: boolean }>`
  cursor: pointer;
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  ${({ isSwap }) =>
    !isSwap &&
    css`
      top: 50%;
      margin-top: -10px;
    `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    top: 50%;
    margin-top: -10px;
  `};
`
const BodyText = styled.div<{ isSwap?: boolean }>`
  font-size: 12px;
  padding: 6px 32px 6px 8px;
  ${({ isSwap }) =>
    isSwap &&
    css`
      display: flex;
      flex-direction: column;
      font-size: 14px;
      padding: 14px 16px;
      cursor: pointer;
    `}
`
const Header = styled.h2`
  font-weight: 600;
  font-size: 16px;
  margin: 0;
`
const NetworkSelectorLink = styled.a`
  color: ${({ theme }) => theme.text1};
  font-weight: 500;
  cursor: pointer;
  :hover,
  :focus,
  :active {
    text-decoration: underline;
  }
`
interface LayerTwoPromotionProps {
  isSwap?: boolean
  hasExistingPosition?: boolean
}

export function LayerTwoPromotion(props: LayerTwoPromotionProps) {
  const { isSwap, hasExistingPosition } = props
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [layerTwoInfoAcknowledged, setLayerTwoInfoAcknowledged] = useLayerTwoSwapAlert()
  const isPolygon = chainId && [SupportedChainId.POLYGON, SupportedChainId.POLYGON_MUMBAI].includes(chainId)
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  const toggleChain = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const element = event.target as HTMLElement
      if (element.tagName.toLowerCase() !== 'a' || !isSwap) {
        toggle()
      }
    },
    [toggle]
  )

  const dismiss = useCallback(() => {
    setLayerTwoInfoAcknowledged(true)
  }, [setLayerTwoInfoAcknowledged])

  if (!chainId || !L1_CHAIN_IDS.includes(chainId) || isPolygon || layerTwoInfoAcknowledged || hasExistingPosition) {
    return null
  }
  const helpCenterLink = LAYER_TWO_HELP_CENTER_LINK
  return (
    <RootWrapper darkMode={darkMode} isSwap={isSwap}>
      <CloseIcon onClick={dismiss} isSwap={isSwap} />
      <BodyText onClick={isSwap ? toggleChain : undefined} isSwap={isSwap}>
        {isSwap ? (
          <>
            <Header>
              <Trans>Swap on Layer 2</Trans>
            </Header>
            <HideSmall>
              <Trans>
                Enjoy 10x cheaper fees. <ExternalLink href={helpCenterLink}>Learn more</ExternalLink> before you start.
              </Trans>
            </HideSmall>
          </>
        ) : (
          <Trans>
            Provide liquidity on <NetworkSelectorLink onClick={toggleChain}>L2 networks</NetworkSelectorLink> to save on
            fees. <ExternalLink href={helpCenterLink}>Learn More</ExternalLink> about the benefits and risks before you
            start.
          </Trans>
        )}
      </BodyText>
    </RootWrapper>
  )
}
