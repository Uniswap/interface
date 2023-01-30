import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { Check } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const TokenRow = styled(Row)`
  padding: 8px 0px;
  gap: 12px;
  justify-content: space-between;
  cursor: pointer;
`

const TokenInfoRow = styled(Row)`
  gap: 8px;
`

const StyledBalanceText = styled(ThemedText.SubHeader)`
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  text-overflow: ellipsis;
  text-align: right;
`

const StyledCheck = styled(Check)`
  color: ${({ theme }) => theme.accentAction};
  flex-shrink: 0;
`

interface CurrencyRowProps {
  currency: Currency
  selected: boolean
  selectCurrency: (currency: Currency) => void
}

export const CurrencyRow = ({ currency, selected, selectCurrency }: CurrencyRowProps) => {
  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account ?? undefined, currency)

  return (
    <TokenRow onClick={() => selectCurrency(currency)}>
      <TokenInfoRow>
        <CurrencyLogo currency={currency} size="36px" />
        <Column>
          <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
            {currency.name}
          </ThemedText.SubHeader>
          <ThemedText.BodySmall lineHeight="20px" color="textSecondary">
            {currency.symbol}
          </ThemedText.BodySmall>
        </Column>
      </TokenInfoRow>
      {balance && <Balance balance={balance} />}
      {selected && <StyledCheck size={20} />}
    </TokenRow>
  )
}

const Balance = ({ balance }: { balance: CurrencyAmount<Currency> }) => {
  return (
    <StyledBalanceText fontWeight={500} lineHeight="24px">
      {balance.toSignificant(4)}
    </StyledBalanceText>
  )
}
