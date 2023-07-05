import { Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useCurrency } from 'hooks/Tokens'
import { CheckMarkIcon } from 'nft/components/icons'
import { useCallback } from 'react'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import styled, { useTheme } from 'styled-components/macro'

const LOGO_SIZE = 20

const Container = styled.button<{ disabled: boolean }>`
  align-items: center;
  background: none;
  border: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.textPrimary};
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  justify-content: space-between;
  line-height: 24px;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  padding: 10px 8px;
  text-align: left;
  transition: ${({ theme }) => theme.transition.duration.medium} ${({ theme }) => theme.transition.timing.ease}
    background-color;
  width: 240px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
  }

  &:hover {
    background-color: ${({ disabled, theme }) => (disabled ? 'none' : theme.backgroundOutline)};
  }
`

const Label = styled.div`
  grid-column: 2;
  grid-row: 1;
  font-size: 16px;
`

const Status = styled.div`
  grid-column: 3;
  grid-row: 1;
  display: flex;
  align-items: center;
  width: ${LOGO_SIZE}px;
`

const CaptionText = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
  grid-column: 2;
  grid-row: 2;
`

const Logo = styled.img`
  height: ${LOGO_SIZE}px;
  width: ${LOGO_SIZE}px;
  margin-right: 12px;
`
interface TokenSelectorRowProps {
  currencyId: string
  isInput: boolean
  onCurrencySelect: (currency: Currency) => void
}

export default function ChainSelectorRow({ currencyId, isInput, onCurrencySelect }: TokenSelectorRowProps) {
  // const { chainId } = useWeb3React()
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState();

  const active = isInput ? currencyId === inputCurrencyId : currencyId === outputCurrencyId
  const currency = useCurrency(currencyId)
  const label = currency?.symbol as string



  const theme = useTheme()

  return (
    <Container
      disabled={false}
      onClick={() => {
        currency && onCurrencySelect(currency)
      }}
      data-testid={`chain-selector-option-${label.toLowerCase()}`}
    >
      <CurrencyLogo currency={currency} />
      <Label>{label}</Label>
      <Status>
        {active && <CheckMarkIcon width={LOGO_SIZE} height={LOGO_SIZE} color={theme.accentActive} />}
      </Status>
    </Container>
  )
}
