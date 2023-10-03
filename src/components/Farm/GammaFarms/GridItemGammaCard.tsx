import { formatNumber } from '@uniswap/conedison/format'
import { ButtonPrimary } from 'components/Button'
import { StyledBalanceMax } from 'components/CurrencyInputPanel'
import styled, { useTheme } from 'styled-components/macro'

import { Input as NumericalInput } from '../../NumericalInput'

const GridItem = styled.div`
  padding: 20px;
  text-align: center;
  font-size: 18px;
`
const StyledNumericalInput = styled(NumericalInput)`
  text-align: left;
  font-size: 24px;
  line-height: 44px;
  font-variant: small-caps;
`

const Container = styled.div`
  border-radius: '20px';
  border: 1px solid ${({ theme }) => theme.backgroundInteractive};
  border-radius: 16px;
  margin-top: 10px;
  margin-bottom: 10px;
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  align-items: center;
`

interface GridItemGammaCardProps {
  availableStakeAmount?: string
  availableStakeUSD?: number
  stakedAmount?: string
  unStakeAmount?: string
  stakedUSD?: number
  stakeAmount: string
  setStakeAmount: (amount: string) => void
  setUnStakeAmount: (amount: string) => void
  textButton: string
  titleText: string
  approveOrStakeLP?: () => void
  unStakeLP?: () => void
  stakeButtonDisabled?: boolean
  unStakeButtonDisabled?: boolean
  tokenLPSymbol: string
}

export function GridItemGammaCard({
  availableStakeAmount,
  availableStakeUSD,
  stakeAmount = '',
  setStakeAmount,
  setUnStakeAmount,
  approveOrStakeLP,
  stakeButtonDisabled,
  textButton,
  titleText,
  stakedAmount,
  stakedUSD,
  unStakeAmount = '',
  unStakeLP,
  unStakeButtonDisabled,
  tokenLPSymbol = 'LP',
}: GridItemGammaCardProps) {
  const theme = useTheme()

  return (
    <GridItem>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <small style={{ color: theme.textSecondary }}>{titleText}</small>
        {availableStakeAmount && availableStakeUSD && (
          <small>{`${formatNumber(Number(availableStakeAmount))} ${tokenLPSymbol} $${formatNumber(
            availableStakeUSD
          )}`}</small>
        )}

        {stakedAmount && stakedUSD && (
          <small>{`${formatNumber(Number(stakedAmount))} ${tokenLPSymbol} $${formatNumber(stakedUSD)}`}</small>
        )}
      </div>

      {availableStakeAmount && (
        <Container>
          <StyledNumericalInput className="token-amount-input" value={stakeAmount} onUserInput={setStakeAmount} />
          <StyledBalanceMax onClick={() => setStakeAmount(availableStakeAmount)}>MAX</StyledBalanceMax>
        </Container>
      )}

      {stakedAmount && (
        <Container>
          <StyledNumericalInput className="token-amount-input" value={unStakeAmount} onUserInput={setUnStakeAmount} />
          <StyledBalanceMax onClick={() => setUnStakeAmount(stakedAmount)}>MAX</StyledBalanceMax>
        </Container>
      )}

      <div style={{ marginTop: 5 }}>
        {approveOrStakeLP && (
          <ButtonPrimary style={{ height: '40px' }} disabled={stakeButtonDisabled} onClick={approveOrStakeLP}>
            {textButton}
          </ButtonPrimary>
        )}

        {unStakeLP && (
          <ButtonPrimary style={{ height: '40px' }} disabled={unStakeButtonDisabled} onClick={unStakeLP}>
            {textButton}
          </ButtonPrimary>
        )}
      </div>
    </GridItem>
  )
}
