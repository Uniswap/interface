import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import ReactGA from 'react-ga'
import styled, { keyframes } from 'styled-components/macro'
import { TYPE } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
import { ResponsiveTooltipContainer } from './styleds'

const GasWrapper = styled(RowFixed)`
  border-radius: 12px;
  padding: 4px 6px;
  height: 24px;
  color: ${({ theme }) => theme.text3};
  background-color: ${({ theme }) => theme.bg1};
  font-size: 14px;
  font-weight: 500;
`
const StyledIcon = styled(GasIcon)`
  margin-right: 4px;
  height: 14px;
  & > * {
    & > * {
      stroke: ${({ theme }) => theme.text3};
    }
  }
`

const StyledPolling = styled.div`
  display: flex;
  margin-left: 4px;
  height: 16px;
  width: 16px;
  align-items: center;
  color: ${({ theme }) => theme.text1};
  transition: 250ms ease color;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme }) => theme.bg2};
  transition: 250ms ease background-color;
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);
  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.text1};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;
  transition: 250ms ease border-color;
  left: -3px;
  top: -3px;
`

export default function GasEstimateBadge({
  gasUseEstimateUSD,
  loading,
}: {
  gasUseEstimateUSD: CurrencyAmount<Token> | null // dollar amount in active chain's stabelcoin
  loading: boolean
}) {
  return (
    <MouseoverTooltipContent
      wrap={false}
      content={
        loading ? null : (
          <ResponsiveTooltipContainer origin="top right" style={{ padding: '12px' }}>
            <AutoColumn gap="4px" justify="center">
              <TYPE.main fontSize="12px" textAlign="center">
                <Trans>Estimated network fee</Trans>
              </TYPE.main>
              <TYPE.body textAlign="center" fontWeight={500}>
                <Trans>${gasUseEstimateUSD?.toFixed(2)}</Trans>
              </TYPE.body>
              <TYPE.main fontSize="10px" textAlign="center" maxWidth="140px" color="text3">
                <Trans>Estimate may differ due to your wallet gas settings</Trans>
              </TYPE.main>
            </AutoColumn>
          </ResponsiveTooltipContainer>
        )
      }
      placement="bottom"
      onOpen={() =>
        ReactGA.event({
          category: 'Swap',
          action: 'Transaction Details Tooltip Open',
        })
      }
    >
      <LoadingOpacityContainer $loading={loading}>
        <GasWrapper>
          <StyledIcon />
          {loading && !gasUseEstimateUSD ? (
            <StyledPolling>
              <StyledPollingDot>
                <Spinner />
              </StyledPollingDot>
            </StyledPolling>
          ) : null}
          {gasUseEstimateUSD ? <Trans>${gasUseEstimateUSD?.toFixed(2)}</Trans> : null}
        </GasWrapper>
      </LoadingOpacityContainer>
    </MouseoverTooltipContent>
  )
}
