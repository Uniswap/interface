import { Trans } from '@lingui/macro'
import { CHAIN_INFO, L2ChainInfo, SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { AlertOctagon } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

const BodyRow = styled.div`
  color: ${({ theme }) => theme.black};
  font-size: 12px;
`
const CautionIcon = styled(AlertOctagon)`
  color: ${({ theme }) => theme.black};
`
const Link = styled(ExternalLink)`
  color: ${({ theme }) => theme.black};
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
  const { chainId } = useActiveWeb3React()
  const info = CHAIN_INFO[chainId ?? SupportedChainId.MAINNET]
  const label = info?.label

  return (
    <Wrapper>
      <TitleRow>
        <CautionIcon />
        <TitleText>
          <Trans>Network Warning</Trans>
        </TitleText>
      </TitleRow>
      <BodyRow>
        {chainId === SupportedChainId.MAINNET ? (
          <Trans>You may have lost your network connection.</Trans>
        ) : (
          <Trans>You may have lost your network connection, or {label} might be down right now.</Trans>
        )}{' '}
        {(info as L2ChainInfo).statusPage !== undefined && (
          <span>
            <Trans>Check network status</Trans>{' '}
            <Link href={(info as L2ChainInfo).statusPage || ''}>
              <Trans>here.</Trans>
            </Link>
          </span>
        )}
      </BodyRow>
    </Wrapper>
  )
}
