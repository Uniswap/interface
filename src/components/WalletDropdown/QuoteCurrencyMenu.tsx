import { Trans } from '@lingui/macro'
import { Currency, SupportedChainId } from '@uniswap/sdk-core'
import { ExtendedEther } from '@uniswap/smart-order-router'
import { DAI, renBTC, USDC_MAINNET } from 'constants/tokens'
import { Check } from 'react-feather'
import { useSetQuoteCurrency } from 'state/application/hooks'
import { useAppSelector } from 'state/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { shortenAddress } from 'utils'

import { SlideOutMenu } from './SlideOutMenu'

const ButtonWrapper = styled.button`
  background-color: transparent;
  margin: 0;
  border: none;
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 400;
  width: 100%;
  padding: 12px 16px;
  color: ${({ theme }) => theme.textSecondary};
  :hover {
    color: ${({ theme }) => theme.textPrimary};
    background-color: ${({ theme }) => theme.backgroundModule};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} all ${timing.in}`};
  }
`

function CurrencyOption({
  currency,
  isActive,
  onClick,
}: {
  currency: Currency
  isActive: boolean
  onClick: () => void
}) {
  const theme = useTheme()

  return (
    <ButtonWrapper onClick={onClick}>
      <ThemedText.BodyPrimary data-testid="quote-currency-option">
        {currency.symbol}
        {!currency.isNative && ` (${shortenAddress(currency.address)})`}
      </ThemedText.BodyPrimary>
      {isActive && <Check color={theme.accentActive} opacity={1} size={20} />}
    </ButtonWrapper>
  )
}

const SUPPORTED_QUOTE_CURRENCIES = [ExtendedEther.onChain(SupportedChainId.MAINNET), DAI, USDC_MAINNET, renBTC]

const QuoteCurrencyMenu = ({ onClose }: { onClose: () => void }) => {
  const activeQuoteCurrency = useAppSelector((state) => state.application.quoteCurrency)
  const setQuoteCurrency = useSetQuoteCurrency()
  return (
    <SlideOutMenu title={<Trans>Quote Currency</Trans>} onClose={onClose}>
      {SUPPORTED_QUOTE_CURRENCIES.map((currency) => (
        <CurrencyOption
          currency={currency}
          isActive={currency.equals(activeQuoteCurrency)}
          onClick={() => setQuoteCurrency(currency)}
          key={currency.wrapped.address}
        />
      ))}
    </SlideOutMenu>
  )
}

export default QuoteCurrencyMenu
