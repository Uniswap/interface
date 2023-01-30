import { Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import Column from 'components/Column'
import Row from 'components/Row'
import { useAllTokens } from 'hooks/Tokens'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { tokenComparator } from 'lib/hooks/useTokenList/sorting'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { useMemo } from 'react'
import { X } from 'react-feather'
import { useAllTokenBalances } from 'state/connection/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import { CurrencyRow } from './CurrencyRow'

const ModalWrapper = styled(Column)`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  height: 368px;
  z-index: ${Z_INDEX.modalOverTooltip};
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  box-shadow: ${({ theme }) => theme.deepShadow};
`

const TitleRow = styled(Row)`
  padding: 20px;
  justify-content: space-between;
`

const TokenSelectorContainer = styled(Column)`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  padding: 20px;
  height: 100%;
  overflow-y: scroll;
  gap: 8px;
  ::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }
`

interface BagTokenSelectorModalProps {
  selectedCurrency: Currency | undefined
  handleCurrencySelect: (currency: Currency) => void
  overlayClick: () => void
}

export const BagTokenSelectorModal = ({
  selectedCurrency,
  handleCurrencySelect,
  overlayClick,
}: BagTokenSelectorModalProps) => {
  const defaultTokens = useAllTokens()
  const [balances, balancesAreLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(
    () =>
      !balancesAreLoading
        ? Object.values(defaultTokens)
            .filter((token) => {
              return balances[token.address]?.greaterThan(0)
            })
            .sort(tokenComparator.bind(null, balances))
        : [],
    [balances, balancesAreLoading, defaultTokens]
  )

  const native = useNativeCurrency()
  const wrapped = native.wrapped

  const currencies: Currency[] = useMemo(() => {
    const tokens = sortedTokens.filter((t) => !t.equals(wrapped))
    const natives: Currency[] = []
    if (native.equals(wrapped)) {
      natives.push(wrapped)
    } else {
      natives.push(native)
      if (balances[wrapped.address]?.greaterThan(0)) {
        natives.push(wrapped)
      }
    }
    return [...natives, ...tokens]
  }, [sortedTokens, native, wrapped, balances])

  return (
    <Portal>
      <ModalWrapper>
        <TitleRow>
          <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
            <Trans>Select a token</Trans>
          </ThemedText.SubHeader>
          <X size={24} cursor="pointer" onClick={overlayClick} />
        </TitleRow>
        <TokenSelectorContainer>
          {currencies.map((currency) => {
            return (
              <CurrencyRow
                key={currency.isToken ? currency.wrapped.address : currency.name}
                currency={currency}
                selected={
                  (!selectedCurrency && currency.isNative) || (!!selectedCurrency && selectedCurrency.equals(currency))
                }
                selectCurrency={handleCurrencySelect}
              />
            )
          })}
        </TokenSelectorContainer>
      </ModalWrapper>
      <Overlay onClick={overlayClick} />
    </Portal>
  )
}
