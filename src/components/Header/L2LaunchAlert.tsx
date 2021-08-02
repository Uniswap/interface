import { Trans } from '@lingui/macro'
import optimismLogoUrl from 'assets/svg/optimism_logo.svg'
import { BaseButton } from 'components/Button'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useAppSelector } from 'state/hooks'
import styled from 'styled-components/macro'
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
const L2LaunchAlertWrapper = styled.div`
  display: none;
  position: absolute;
  top: 80px;
  right: 20px;
  background: radial-gradient(948.6% 291.5% at 41.77% 0%, rgba(255, 58, 212, 0.06) 0%, rgba(255, 255, 255, 0.04) 100%),
    radial-gradient(98.16% 96.19% at 1.84% 0%, rgba(255, 39, 39, 0.3) 0%, rgba(235, 0, 255, 0.207) 95.71%);
  border-radius: 12px;
  overflow: hidden;
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
  color: ${({ theme }) => theme.text1};
  font-size: 16px;
`
const SwitchNetworks = styled(BaseButton)`
  background-color: black;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  height: 36px;
  margin-right: 12px;
  padding: 8px 12px;
  width: 120px;
`

export default function L2LaunchAlert() {
  const { account, library } = useActiveWeb3React()
  const [locallyDismissed, setLocallyDimissed] = useState(false)
  const implements3085 = useAppSelector((state) => state.application.implements3085)

  const dismiss = useCallback(() => {
    setLocallyDimissed(true)
  }, [setLocallyDimissed])

  if (locallyDismissed || !library || !account) {
    return null
  }

  return (
    <L2LaunchAlertWrapper>
      <CloseIcon onClick={dismiss} />
      <ContentWrapper>
        <L2Icon src={optimismLogoUrl} />
        <Header>
          <Trans>Uniswap on Optimism</Trans>
        </Header>
        <Body>
          <Trans>Instant transactions, Native meta-transactions, No gas, and Low fees.</Trans>
        </Body>
      </ContentWrapper>
      <ControlsWrapper>
        {implements3085 && (
          <SwitchNetworks onClick={() => switchToNetwork({ library, chainId: SupportedChainId.OPTIMISM })}>
            <Trans>Try the beta</Trans>
          </SwitchNetworks>
        )}
        <ReadMoreLink href="https://help.uniswap.org/en/articles/5391401-uniswap-on-optimistic-ethereum">
          <Trans>Read more</Trans>
        </ReadMoreLink>
      </ControlsWrapper>
    </L2LaunchAlertWrapper>
  )
}
