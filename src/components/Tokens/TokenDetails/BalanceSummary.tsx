import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { formatToDecimal } from 'analytics/utils'
import CurrencyLogo from 'components/CurrencyLogo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { StyledInternalLink } from 'theme'
import { currencyAmountToPreciseFloat, formatDollar } from 'utils/formatNumbers'

const BalancesCard = styled.div`
  box-shadow: ${({ theme }) => theme.shallowShadow};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  border-radius: 16px;
  color: ${({ theme }) => theme.textPrimary};
  display: none;
  font-size: 12px;
  height: fit-content;
  line-height: 16px;
  padding: 20px;
  width: 100%;

  // 768 hardcoded to match NFT-redesign navbar breakpoints
  // src/nft/css/sprinkles.css.ts
  // change to match theme breakpoints when this navbar is updated
  @media screen and (min-width: 768px) {
    display: flex;
  }
`
const BalanceSection = styled.div`
  height: fit-content;
  width: 100%;
`
const BalanceRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  font-size: 20px;
  justify-content: space-between;
  line-height: 28px;
  margin-top: 12px;
`
const BalanceItem = styled.div`
  display: flex;
`

const BalanceLink = styled(StyledInternalLink)`
  color: unset;
`

export function useFormatBalance(balance: CurrencyAmount<Currency> | undefined) {
  return useMemo(
    () => (balance ? formatToDecimal(balance, Math.min(balance.currency.decimals, 2)) : undefined),
    [balance]
  )
}

export function useFormatUsdValue(usdValue: CurrencyAmount<Token> | null) {
  return useMemo(() => {
    const float = usdValue ? currencyAmountToPreciseFloat(usdValue) : undefined
    if (!float) return undefined
    return formatDollar({ num: float, isPrice: true })
  }, [usdValue])
}

export default function BalanceSummary({ token }: { token: Currency }) {
  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account, token)
  const formattedBalance = useFormatBalance(balance)
  const usdValue = useStablecoinValue(balance)
  const formattedUsdValue = useFormatUsdValue(usdValue)
  const chain = CHAIN_ID_TO_BACKEND_NAME[token.chainId].toLowerCase()

  if (!account || !balance) return null
  return (
    <BalancesCard>
      <BalanceSection>
        <Trans>Your balance</Trans>
        <BalanceLink to={`/tokens/${chain}/${token.isNative ? NATIVE_CHAIN_ID : token.address}`}>
          <BalanceRow>
            <BalanceItem>
              <CurrencyLogo currency={token} />
              &nbsp;{formattedBalance} {token.symbol}
            </BalanceItem>
            <BalanceItem>{formattedUsdValue}</BalanceItem>
          </BalanceRow>
        </BalanceLink>
      </BalanceSection>
    </BalancesCard>
  )
}
