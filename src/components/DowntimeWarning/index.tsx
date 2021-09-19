import { Trans } from '@lingui/macro'
import { L2_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

const Root = styled.div`
  background-color: ${({ theme }) => (theme.darkMode ? '#888D9B' : '#CED0D9')};
  border-radius: 18px;
  color: black;
  margin-top: 16px;
  padding: 16px;
  width: 100%;
  max-width: 880px;
`
const WarningIcon = styled(AlertOctagon)`
  margin: 0 8px 0 0;
`
const TitleRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 25px;
`
const Body = styled.div`
  font-size: 12px;
  line-height: 15px;
  margin: 8px 0 0 0;
`
const ReadMoreLink = styled(ExternalLink)`
  color: black;
  text-decoration: underline;
`

export default function DowntimeWarning() {
  const { chainId } = useActiveWeb3React()
  if (!chainId || !L2_CHAIN_IDS.includes(chainId)) {
    return null
  }

  const Content = () => {
    switch (chainId) {
      case SupportedChainId.OPTIMISM:
      case SupportedChainId.OPTIMISTIC_KOVAN:
        return (
          <Trans>
            Optimistic Ethereum is in Beta and may experience downtime. Optimism expects planned downtime to upgrade the
            network in the near future. During downtime, your position will not earn fees and you will be unable to
            remove liquidity.{' '}
            <ReadMoreLink href="https://help.uniswap.org/en/articles/5406082-what-happens-if-the-optimistic-ethereum-network-experiences-downtime">
              Read more.
            </ReadMoreLink>
          </Trans>
        )
      case SupportedChainId.ARBITRUM_ONE:
      case SupportedChainId.ARBITRUM_RINKEBY:
        return (
          <Trans>
            Arbitrum is in Beta and may experience downtime. During downtime, your position will not earn fees and you
            will be unable to remove liquidity.
            <br />
            <ReadMoreLink href="https://help.uniswap.org/en/articles/5576122-arbitrum-network-downtime">
              Read more.
            </ReadMoreLink>
          </Trans>
        )
      default:
        return null
    }
  }

  return (
    <Root>
      <TitleRow>
        <WarningIcon />
        <Trans>Downtime Warning</Trans>
      </TitleRow>
      <Body>
        <Content />
      </Body>
    </Root>
  )
}
