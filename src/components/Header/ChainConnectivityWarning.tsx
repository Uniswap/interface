import { Trans } from '@lingui/macro'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

const BodyRow = styled.div`
  color: black;
  font-size: 12px;
`
const CautionIcon = styled(AlertOctagon)`
  color: black;
`
const Link = styled(ExternalLink)`
  color: black;
  text-decoration: underline;
`
const TitleRow = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
`
const TitleText = styled.div`
  color: black;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  margin: 0px 12px;
`
const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.yellow3};
  border-radius: 12px;
  bottom: 60px;
  display: none;
  max-width: 348px;
  padding: 16px 20px;
  position: absolute;
  right: 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToMedium}px) {
    display: block;
  }
`

export function ChainConnectivityWarning() {
  return (
    <Wrapper>
      <TitleRow>
        <CautionIcon />
        <TitleText>
          <Trans>Network Downtime Warning</Trans>
        </TitleText>
      </TitleRow>
      <BodyRow>
        <Trans>
          The Optimism network is down right now, or you may have lost connection to the sequencer. Check Optimism
          network status
        </Trans>{' '}
        <Link href="">
          <Trans>here.</Trans>
        </Link>
      </BodyRow>
    </Wrapper>
  )
}
