import { useAccount } from 'hooks/useAccount'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useIsNftPage } from 'hooks/useIsNftPage'
import useMachineTimeMs from 'hooks/useMachineTime'
import styled from 'lib/styled-components'
import { useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import { ExternalLink } from 'theme/components'
import { DEFAULT_MS_BEFORE_WARNING, getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AVERAGE_L1_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { Trans } from 'uniswap/src/i18n'

const BodyRow = styled.div`
  color: ${({ theme }) => theme.neutral1};
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
  z-index: 2;
  display: block;
  max-width: 348px;
  padding: 16px 20px;
  position: fixed;
  bottom: 16px;
  right: 16px;
`

export function ChainConnectivityWarning() {
  const { chainId } = useAccount()
  const { defaultChainId } = useEnabledChains()
  const info = getChainInfo(chainId ?? defaultChainId)
  const label = info.label

  const isNftPage = useIsNftPage()
  const isLandingPage = useIsLandingPage()

  const waitMsBeforeWarning = useMemo(
    () => (chainId ? getChainInfo(chainId)?.blockWaitMsBeforeWarning : undefined) ?? DEFAULT_MS_BEFORE_WARNING,
    [chainId],
  )
  const machineTime = useMachineTimeMs(AVERAGE_L1_BLOCK_TIME_MS)
  const blockTime = useCurrentBlockTimestamp(
    useMemo(
      () => ({
        blocksPerFetch: /* 5m / 12s = */ 25 * (chainId ? getChainInfo(chainId).blockPerMainnetEpochForChainId : 1),
      }),
      [chainId],
    ),
  )
  const warning = Boolean(!!blockTime && machineTime - blockTime.mul(1000).toNumber() > waitMsBeforeWarning)

  if (!warning || isNftPage || isLandingPage) {
    return null
  }

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
          <Trans i18nKey="network.mightBeDown" values={{ network: label }} />
        )}{' '}
        {info.statusPage !== undefined && (
          <span>
            <Trans i18nKey="common.checkNetwork" components={{ link: <Link href={info.statusPage || ''} /> }} />
          </span>
        )}
      </BodyRow>
    </Wrapper>
  )
}
