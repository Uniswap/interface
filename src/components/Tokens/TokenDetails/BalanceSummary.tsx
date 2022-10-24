import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { formatToDecimal } from 'analytics/utils'
import CurrencyLogo from 'components/CurrencyLogo'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
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

interface BalanceProps {
  token: Currency
  amount?: CurrencyAmount<Currency>
  href?: string
}

function Balance({ token, amount, href }: BalanceProps) {
  const formattedBalance = useMemo(
    () => (amount ? formatToDecimal(amount, Math.min(amount.currency.decimals, 2)) : '-'),
    [amount]
  )
  const usdValue = useStablecoinValue(amount) ?? undefined
  const formattedUsd = useMemo(() => {
    const float = currencyAmountToPreciseFloat(usdValue)
    if (float === 0) return undefined
    return formatDollar({ num: float, isPrice: true })
  }, [usdValue])
  const content = (
    <BalanceRow>
      <BalanceItem>
        <CurrencyLogo currency={token} />
        &nbsp;{formattedBalance} {token.symbol}
      </BalanceItem>
      <BalanceItem>{formattedUsd}</BalanceItem>
    </BalanceRow>
  )
  if (href) {
    return <BalanceLink to={href}>{content}</BalanceLink>
  }
  return content
}

export default function BalanceSummary({ token }: { token: Currency }) {
  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account, token)
  const nativeCurrency = nativeOnChain(token.chainId)
  const nativeBalance = useCurrencyBalance(account, nativeCurrency)
  const chain = CHAIN_ID_TO_BACKEND_NAME[token.chainId].toLowerCase()

  if (!account) return null
  return (
    <BalancesCard>
      <BalanceSection>
        <Trans>Your balance</Trans>
        {
          <Balance
            token={token}
            amount={balance}
            href={`/tokens/${chain}/${token.isNative ? NATIVE_CHAIN_ID : token.address}`}
          />
        }
        {!token.equals(nativeCurrency) && (
          <Balance token={nativeCurrency} amount={nativeBalance} href={`/tokens/${chain}/${NATIVE_CHAIN_ID}`} />
        )}
      </BalanceSection>
    </BalancesCard>
  )
}
