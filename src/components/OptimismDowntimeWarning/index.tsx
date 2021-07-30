import { Trans } from '@lingui/macro'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

const Root = styled.div`
  background-color: ${({ theme }) => theme.yellow3};
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

export default function OptimismDowntimeWarning() {
  const { chainId } = useActiveWeb3React()
  if (!chainId || ![SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN].includes(chainId)) {
    return null
  }

  return (
    <Root>
      <TitleRow>
        <WarningIcon />
        <Trans>Optimism Planned Downtime</Trans>
      </TitleRow>
      <Body>
        <Trans>
          Optimism expects planned downtime in the near future. Unplanned downtime may also occur. While the network is
          down, fees will not be generated and you will be unable to remove liquidity.{' '}
          <ReadMoreLink href="https://help.uniswap.org/en/articles/5406082-what-happens-if-the-optimistic-ethereum-network-experiences-downtime">
            Read more.
          </ReadMoreLink>
        </Trans>
      </Body>
    </Root>
  )
}
