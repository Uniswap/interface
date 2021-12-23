import { Trans } from '@lingui/macro'
import { L1_CHAIN_IDS, LAYER_TWO_HELP_CENTER_LINK } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback } from 'react'
import { X } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useDarkModeManager, useLayerTwoSwapAlert } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

import { WrapperBackgroundDarkMode, WrapperBackgroundLightMode } from './styled'

const RootWrapper = styled.div<{ darkMode: boolean }>`
  ${({ darkMode }) => (darkMode ? WrapperBackgroundDarkMode : WrapperBackgroundLightMode)};
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  width: 100%;
  min-height: 54px;
  padding: 8px 16px;
  border-radius: 12px;
  margin: 12px auto 0;
`
const Body = styled.div`
  font-size: 12px;
  line-height: 143%;
`
const NetworkSelectorLink = styled.div`
  display: inline-flex;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  :hover,
  :focus,
  :active {
    text-decoration: underline;
  }
`
const LearnMoreLink = styled(ExternalLink)`
  background-color: transparent;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  width: auto;
`
const CloseIcon = styled(X)`
  flex: 0 0 auto;
  cursor: pointer;
`

interface LayerTwoAddLiquidityPromotionProps {
  hasExistingPosition: boolean
}

export function LayerTwoAddLiquidityPromotion(props: LayerTwoAddLiquidityPromotionProps) {
  const { hasExistingPosition } = props
  const helpCenterLink = LAYER_TWO_HELP_CENTER_LINK
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  const [layerTwoInfoAcknowledged, setLayerTwoInfoAcknowledged] = useLayerTwoSwapAlert()
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  const toggleChain = useCallback(() => {
    toggle()
  }, [toggle])

  const dismiss = useCallback(() => {
    setLayerTwoInfoAcknowledged(true)
  }, [setLayerTwoInfoAcknowledged])

  if (!chainId || !L1_CHAIN_IDS.includes(chainId) || layerTwoInfoAcknowledged || hasExistingPosition) {
    return null
  }
  return (
    <RootWrapper darkMode={darkMode}>
      <>
        <Body>
          <Trans>
            Provide liquidity on{' '}
            <NetworkSelectorLink onClick={toggleChain}>
              <Trans>L2 networks</Trans>
            </NetworkSelectorLink>{' '}
            to save on fees.{' '}
            <LearnMoreLink href={helpCenterLink}>
              <Trans>Learn More</Trans>
            </LearnMoreLink>{' '}
            about the benefits and risks before you start.
          </Trans>
        </Body>
        <CloseIcon onClick={dismiss} />
      </>
    </RootWrapper>
  )
}
