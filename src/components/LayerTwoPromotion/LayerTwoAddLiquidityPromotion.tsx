import { Trans } from '@lingui/macro'
import { L1_CHAIN_IDS, LAYER_TWO_HELP_CENTER_LINK } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback } from 'react'
import { X } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useDarkModeManager, useLayerTwoSwapAlert } from 'state/user/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink } from 'theme'

const Body = styled.div`
  font-size: 12px;
  line-height: 143%;
`
const CloseIcon = styled(X)`
  flex: 0 0 auto;
  cursor: pointer;
`
const LearnMoreLink = styled(ExternalLink)`
  background-color: transparent;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  width: auto;
`
export const WrapperBackgroundDarkMode = css`
  background: radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%),
    radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.5) 0%, rgba(235, 0, 255, 0.345) 96%);
`
export const WrapperBackgroundLightMode = css`
  background: radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),
    radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.5);
`
const RootWrapper = styled.div<{ darkMode: boolean; suggestL2?: boolean }>`
  ${({ darkMode }) => (darkMode ? WrapperBackgroundDarkMode : WrapperBackgroundLightMode)};
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  width: 100%;
  height: 54px;
  padding: 8px 16px;
  border-radius: 12px;
  margin: 12px auto 0;
  ${({ suggestL2, theme }) =>
    !suggestL2 &&
    css`
      ${theme.mediaWidth.upToMedium`
        display: none;
      `}
      visibility: hidden;
    `}
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

interface LayerTwoAddLiquidityPromotionProps {
  suggestL2?: boolean
}

export function LayerTwoAddLiquidityPromotion(props: LayerTwoAddLiquidityPromotionProps) {
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

  if (!chainId || !L1_CHAIN_IDS.includes(chainId) || layerTwoInfoAcknowledged) {
    return null
  }
  const helpCenterLink = LAYER_TWO_HELP_CENTER_LINK
  return (
    <RootWrapper darkMode={darkMode} suggestL2={props.suggestL2}>
      {props.suggestL2 && (
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
      )}
    </RootWrapper>
  )
}
