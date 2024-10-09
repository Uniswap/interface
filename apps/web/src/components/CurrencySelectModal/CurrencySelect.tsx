import { InterfaceEventName, InterfaceModalName } from '@ubeswap/analytics-events'
import { Currency } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import CurrencyList, { CurrencyListRow } from 'components/SearchModal/CurrencyList'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useToggle from 'hooks/useToggle'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { Trans } from 'i18n'
import { useCallback, useMemo, useRef } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import Column from '../Column'
import { RowBetween } from '../Row'
import { PaddedColumn, Separator } from './styled'

const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  overflow: hidden;
  flex: 1 1;
  position: relative;
  border-radius: 20px;
`

interface CurrencySelectProps {
  isOpen: boolean
  currencies: Maybe<Currency>[]
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
}

export function CurrencySelect({
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCurrencyAmount,
  onDismiss,
}: CurrencySelectProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const { balanceMap } = useTokenBalances()

  const isLoading = currencies.filter((curr) => !curr).length > 0

  const allCurrencyRows = useMemo(() => {
    return currencies.map((curr) => new CurrencyListRow(curr || undefined))
  }, [currencies])

  const selectChain = useSelectChain()
  const handleCurrencySelect = useCallback(
    async (currency: Currency, hasWarning?: boolean) => {
      if (currency.chainId !== chainId) {
        const result = await selectChain(currency.chainId)
        if (!result) {
          // failed to switch chains, don't select the currency
          return
        }
      }
      onCurrencySelect(currency, hasWarning)
      if (!hasWarning) onDismiss()
    },
    [chainId, onCurrencySelect, onDismiss, selectChain]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <ContentWrapper>
      <Trace
        name={InterfaceEventName.TOKEN_SELECTOR_OPENED}
        modal={InterfaceModalName.TOKEN_SELECTOR}
        shouldLogImpression
      >
        <PaddedColumn gap="16px">
          <RowBetween>
            <Text fontWeight={535} fontSize={16}>
              <Trans>Select a token</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        </PaddedColumn>
        <Separator />
        {allCurrencyRows.some((currencyRow) => !!currencyRow.currency) || isLoading ? (
          <div style={{ flex: '1' }}>
            <AutoSizer disableWidth>
              {({ height }: { height: number }) => (
                <CurrencyList
                  height={height}
                  currencies={allCurrencyRows}
                  onCurrencySelect={handleCurrencySelect}
                  otherCurrency={otherSelectedCurrency}
                  selectedCurrency={selectedCurrency}
                  fixedListRef={fixedList}
                  showCurrencyAmount={showCurrencyAmount}
                  isLoading={isLoading}
                  searchQuery=""
                  isAddressSearch={false}
                  balances={balanceMap}
                />
              )}
            </AutoSizer>
          </div>
        ) : (
          <Column style={{ padding: '20px', height: '100%' }}>
            <ThemedText.DeprecatedMain color={theme.neutral3} textAlign="center" mb="20px">
              <Trans>No results found.</Trans>
            </ThemedText.DeprecatedMain>
          </Column>
        )}
      </Trace>
    </ContentWrapper>
  )
}
