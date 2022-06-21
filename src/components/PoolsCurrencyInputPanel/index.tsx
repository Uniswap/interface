import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { Trans } from '@lingui/macro'
import { Currency } from '@kyberswap/ks-sdk-core'
import { Pair } from '@kyberswap/ks-sdk-classic'

import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { ReactComponent as DropDown } from 'assets/images/dropdown.svg'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { X } from 'react-feather'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 2.25rem;
  font-size: 20px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid transparent;
  color: ${({ theme }) => theme.text};
  border-radius: 40px;
  outline: none;
  cursor: pointer;
  user-select: none;
  padding: 0 0.5rem;

  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg2 : darken(0.05, theme.primary))};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

const StyledDropDown = styled(DropDown)`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ theme }) => theme.text};
    stroke-width: 1.5px;
  }
`

const StyledX = styled(X)`
  margin: 0 0.25rem 0 0.5rem;

  path,
  line {
    stroke: ${({ theme }) => theme.text};
  }

  :hover {
    path,
    line {
      stroke: ${({ theme }) => theme.subText};
    }
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 4px;
  background-color: transparent;
  z-index: 1;
`

const Container = styled.div``

const LogoNameWrapper = styled.div`
  display: flex;
  align-items: center;
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.75rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '16px' : '14px')};
  min-width: max-content;
`

interface CurrencyInputPanelProps {
  onCurrencySelect?: (currency: Currency) => void
  onClearCurrency?: () => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  pair?: Pair | null
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
}

export default function PoolsCurrencyInputPanel({
  onCurrencySelect,
  onClearCurrency,
  currency,
  disableCurrencySelect = false,
  pair = null, // used for double token logo
  otherCurrency,
  id,
  showCommonBases,
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  const clearCurrency = (event: React.MouseEvent<SVGElement>) => {
    event.stopPropagation()
    onClearCurrency && onClearCurrency()
  }

  return (
    <InputPanel id={id}>
      <Container>
        <InputRow style={{ padding: '0', borderRadius: '8px' }} selected={disableCurrencySelect}>
          <CurrencySelect
            selected={!!currency}
            className="open-currency-select-button"
            onClick={() => {
              if (!disableCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <Aligner>
              <LogoNameWrapper>
                {pair ? (
                  <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                ) : currency ? (
                  <CurrencyLogo currency={currency || undefined} size={'24px'} />
                ) : null}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                    {(nativeCurrency && nativeCurrency.symbol && nativeCurrency.symbol.length > 20
                      ? nativeCurrency.symbol.slice(0, 4) +
                        '...' +
                        nativeCurrency.symbol.slice(nativeCurrency.symbol.length - 5, nativeCurrency.symbol.length)
                      : nativeCurrency?.symbol) || <Trans>All Tokens</Trans>}
                  </StyledTokenName>
                )}
              </LogoNameWrapper>
              {!disableCurrencySelect && !currency && <StyledDropDown />}
              {!disableCurrencySelect && currency && <StyledX size={16} onClick={clearCurrency} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>
      </Container>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </InputPanel>
  )
}
