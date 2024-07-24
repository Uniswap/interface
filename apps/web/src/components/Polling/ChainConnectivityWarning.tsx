import { getChain, useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { AlertTriangle } from 'react-feather'
import { MEDIA_WIDTHS } from 'theme'
import { ExternalLink } from 'theme/components'
import { UniverseChainId } from 'uniswap/src/types/chains'

const BodyRow = styled.div`
  color: ${({ theme }) => theme.neutral1};
  font-size: 12px;
  font-weight: 485;
  font-size: 14px;
  line-height: 20px;
`
const CautionTriangle = styled(AlertTriangle)`
  color: ${({ theme }) => theme.deprecated_accentWarning};
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
  color: ${({ theme }) => theme.neutral1};
  font-weight: 535;
  font-size: 16px;
  line-height: 24px;
  margin: 0px 12px;
`
const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  bottom: 60px;
  z-index: 2;
  display: none;
  max-width: 348px;
  padding: 16px 20px;
  position: fixed;
  right: 16px;
  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToMedium}px) {
    display: block;
  }
`

export function ChainConnectivityWarning() {
  const { chainId } = useAccount()
  const supportedChain = useSupportedChainId(chainId)
  const info = getChain({ chainId: supportedChain, withFallback: true })
  const label = info.label

  return (
    <Wrapper>
      <TitleRow>
        <CautionTriangle />
        <TitleText>
          <Trans i18nKey="network.warning" />
        </TitleText>
      </TitleRow>
      <BodyRow>
        {chainId === UniverseChainId.Mainnet ? (
          <Trans i18nKey="network.lostConnection" />
        ) : (
          <Trans i18nKey="network.mightBeDown" values={{ label }} />
        )}{' '}
        {info.statusPage !== undefined && (
          <span>
            <Trans i18nKey="common.checkNetwork" />{' '}
            <Link href={info.statusPage || ''}>
              <Trans>here.</Trans>
            </Link>
          </span>
        )}
      </BodyRow>
    </Wrapper>
  )
}
