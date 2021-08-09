import { Trans } from '@lingui/macro'
import optimismLogoUrl from 'assets/svg/optimism_logo.svg'
import { BaseButton } from 'components/Button'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useAppSelector } from 'state/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { switchToNetwork } from 'utils/switchToNetwork'
import { SupportedChainId } from '../../constants/chains'

const Body = styled.p`
  font-size: 14px;
  line-height: 143%;
  margin: 0;
  grid-column: 1 / 3;
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`
const ContentWrapper = styled.div`
  align-items: center;
  display: grid;
  grid-template-columns: 18px 4fr;
  grid-template-rows: auto auto;
  grid-gap: 8px;
  margin: 20px 16px;
`
const ControlsWrapper = styled.div`
  align-items: center;
  display: flex;
  margin: 0 16px 20px 16px;
`
const Header = styled.h2`
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  padding-right: 30px;
`
const darkModeWrapperBackground = css`
  background: radial-gradient(98% 96% at 2% 0%, hsl(349, 49%, 27%) 0%, hsl(293, 51%, 23%) 100%);
`
const lightModeWrapperBackground = css`
  background: radial-gradient(98% 96% at 2% 0%, hsl(355, 86%, 84%) 0%, hsl(296, 83%, 86%) 100%);
`
const L2LaunchAlertWrapper = styled.div<{ darkMode: boolean }>`
  ${({ darkMode }) => (darkMode ? darkModeWrapperBackground : lightModeWrapperBackground)}
  border-radius: 12px;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
  display: none;
  overflow: hidden;
  position: absolute;
  right: 20px;
  top: 80px;
  width: 348px;
  z-index: -1;
  :before {
    background-image: url(${optimismLogoUrl});
    background-repeat: no-repeat;
    background-size: 300px;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -40px);
    width: 300px;
    z-index: -2;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToLarge}px) {
    display: block;
  }
`
const L2Icon = styled.img`
  width: 18px;
  height: 18px;
  justify-self: center;
`
const ReadMoreLink = styled(ExternalLink)`
  border: 1px solid ${({ theme }) => theme.text1};
  border-radius: 8px;
  color: ${({ theme }) => theme.text1};
  font-size: 16px;
  padding: 8px 12px;
`
const SwitchNetworks = styled(BaseButton)`
  background-color: black;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  height: 36px;
  margin-right: 12px;
  padding: 8px 12px;
  width: 152px;
`

export default function L2LaunchAlert() {
  const { account, library } = useActiveWeb3React()
  const [locallyDismissed, setLocallyDimissed] = useState(false)
  const implements3085 = useAppSelector((state) => state.application.implements3085)
  const [darkMode] = useDarkModeManager()

  const dismiss = useCallback(() => {
    setLocallyDimissed(true)
  }, [setLocallyDimissed])

  if (locallyDismissed || !library || !account) {
    return null
  }

  return (
    <L2LaunchAlertWrapper darkMode={darkMode}>
      <CloseIcon onClick={dismiss} />
      <ContentWrapper>
        <L2Icon src={optimismLogoUrl} />
        <Header>
          <Trans>Uniswap on Optimism</Trans>
        </Header>
        <Body>
          <Trans>Uniswap is now on Layer 2! Enjoy instant transactions and low fees on Optimistic Ethereum (OΞ)</Trans>
        </Body>
      </ContentWrapper>
      <ControlsWrapper>
        {implements3085 && (
          <SwitchNetworks onClick={() => switchToNetwork({ library, chainId: SupportedChainId.OPTIMISM })}>
            ✨<Trans>Try the beta</Trans>✨
          </SwitchNetworks>
        )}
        <ReadMoreLink href="https://uniswap.org/blog/uniswap-optimism-alpha/">
          <Trans>Read more</Trans>
        </ReadMoreLink>
      </ControlsWrapper>
    </L2LaunchAlertWrapper>
  )
}
