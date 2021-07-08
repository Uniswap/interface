import { Trans } from '@lingui/macro'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'

const Root = styled.div`
  background-color: ${({ theme }) => theme.yellow3};
  border-radius: 18px;
  color: black;
  margin-top: 16px;
  max-width: 480px;
  padding: 16px;
  width: 100%;
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
const LinkOutToNotion = styled.a`
  color: black;
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
        <Trans>{'Optimism'} Scheduled Downtimes</Trans>
      </TitleRow>
      <Body>
        <Trans>
          {'Optimism'} expects some scheduled downtime in the near future.&nbsp;
          <LinkOutToNotion
            href={`https://www.notion.so/Optimism-Regenesis-Schedule-8d14a34902ca4f5a8910762b3ec4b8da`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read more.
          </LinkOutToNotion>
        </Trans>
      </Body>
    </Root>
  )
}
