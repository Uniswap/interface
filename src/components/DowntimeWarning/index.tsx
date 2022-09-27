import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

import { isL2ChainId } from '../../utils/chains'

const Root = styled.div`
  background-color: ${({ theme }) => (theme.darkMode ? '#888D9B' : '#CED0D9')};
  border-radius: 18px;
  color: black;
  display: flex;
  flex-direction: row;
  font-size: 14px;
  margin: 12px auto;
  padding: 16px;
  width: 100%;
  max-width: 880px;
`
const WarningIcon = styled(AlertOctagon)`
  margin: auto 16px auto 0;
  min-height: 22px;
  min-width: 22px;
`
const ReadMoreLink = styled(ExternalLink)`
  color: black;
  text-decoration: underline;
`

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Root>
      <WarningIcon />
      <div>{children}</div>
    </Root>
  )
}

/**
 * Shows a downtime warning for the network if it's relevant
 */
export default function DowntimeWarning() {
  const { chainId } = useWeb3React()
  if (!isL2ChainId(chainId)) {
    return null
  }

  switch (chainId) {
    case SupportedChainId.OPTIMISM:
    case SupportedChainId.OPTIMISM_GOERLI:
      return (
        <Wrapper>
          <Trans>
            Optimism is in Beta and may experience downtime. Optimism expects planned downtime to upgrade the network in
            the near future. During downtime, your position will not earn fees and you will be unable to remove
            liquidity.{' '}
            <ReadMoreLink href="https://help.uniswap.org/en/articles/5406082-what-happens-if-the-optimistic-ethereum-network-experiences-downtime">
              Read more.
            </ReadMoreLink>
          </Trans>
        </Wrapper>
      )
    case SupportedChainId.ARBITRUM_ONE:
    case SupportedChainId.ARBITRUM_RINKEBY:
      return (
        <Wrapper>
          <Trans>
            Arbitrum is in Beta and may experience downtime. During downtime, your position will not earn fees and you
            will be unable to remove liquidity.{' '}
            <ReadMoreLink href="https://help.uniswap.org/en/articles/5576122-arbitrum-network-downtime">
              Read more.
            </ReadMoreLink>
          </Trans>
        </Wrapper>
      )

    default:
      return null
  }
}
