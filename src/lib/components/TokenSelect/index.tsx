import { t, Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { Header as DialogHeader } from 'lib/components/Dialog'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import useTokenList, { useIsTokenListLoaded, useQueryTokens } from 'lib/hooks/useTokenList'
import styled, { ThemedText } from 'lib/theme'
import { ElementRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Column from '../Column'
import Dialog from '../Dialog'
import { inputCss, StringInput } from '../Input'
import Row from '../Row'
import Rule from '../Rule'
import NoTokensAvailableOnNetwork from './NoTokensAvailableOnNetwork'
import TokenButton from './TokenButton'
import TokenOptions from './TokenOptions'
import TokenOptionsSkeleton from './TokenOptionsSkeleton'

const SearchInput = styled(StringInput)`
  ${inputCss}
`

function usePrefetchBalances() {
  const { account } = useActiveWeb3React()
  const tokenList = useTokenList()
  const prefetchedTokenList = useRef<typeof tokenList>()
  useCurrencyBalances(account, tokenList !== prefetchedTokenList.current ? tokenList : undefined)
  prefetchedTokenList.current = tokenList
}

function useAreBalancesLoaded(): boolean {
  const { account } = useActiveWeb3React()
  const tokens = useTokenList()
  const native = useNativeCurrency()
  const currencies = useMemo(() => [native, ...tokens], [native, tokens])
  const balances = useCurrencyBalances(account, currencies).filter(Boolean)
  return !account || currencies.length === balances.length
}

interface TokenSelectDialogProps {
  value?: Currency
  onSelect: (token: Currency) => void
  onClose: () => void
}

export function TokenSelectDialog({ value, onSelect, onClose }: TokenSelectDialogProps) {
  const [query, setQuery] = useState('')
  const list = useTokenList()
  const tokens = useQueryTokens(query, list)

  const isTokenListLoaded = useIsTokenListLoaded()
  const areBalancesLoaded = useAreBalancesLoaded()
  const [isLoaded, setIsLoaded] = useState(isTokenListLoaded && areBalancesLoaded)
  // Give the balance-less tokens a small block period to avoid layout thrashing from re-sorting.
  useEffect(() => {
    if (!isLoaded) {
      const timeout = setTimeout(() => setIsLoaded(true), 250)
      return () => clearTimeout(timeout)
    }
    return
  }, [isLoaded])
  useEffect(
    () => setIsLoaded(Boolean(query) || (isTokenListLoaded && areBalancesLoaded)),
    [query, areBalancesLoaded, isTokenListLoaded]
  )

  const input = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.focus({ preventScroll: true }), [input])

  const [options, setOptions] = useState<ElementRef<typeof TokenOptions> | null>(null)

  const { chainId } = useActiveWeb3React()
  const listHasTokens = useMemo(() => list.some((token) => token.chainId === chainId), [chainId, list])

  if (!listHasTokens && isLoaded) {
    return (
      <Dialog color="module" onClose={onClose}>
        <DialogHeader title={<Trans>Select a token</Trans>} />
        <NoTokensAvailableOnNetwork />
      </Dialog>
    )
  }

  return (
    <Dialog color="module" onClose={onClose}>
      <DialogHeader title={<Trans>Select a token</Trans>} />
      <Column gap={0.75}>
        <Row pad={0.75} grow>
          <ThemedText.Body1>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={t`Search by token name or address`}
              onKeyDown={options?.onKeyDown}
              onBlur={options?.blur}
              ref={input}
            />
          </ThemedText.Body1>
        </Row>
        <Rule padded />
      </Column>
      {isLoaded ? (
        tokens.length ? (
          <TokenOptions tokens={tokens} onSelect={onSelect} ref={setOptions} />
        ) : (
          <Column padded>
            <Row justify="center">
              <ThemedText.Body1 color="secondary">
                <Trans>No results found.</Trans>
              </ThemedText.Body1>
            </Row>
          </Column>
        )
      ) : (
        <TokenOptionsSkeleton />
      )}
    </Dialog>
  )
}

interface TokenSelectProps {
  value?: Currency
  collapsed: boolean
  disabled?: boolean
  onSelect: (value: Currency) => void
}

export default memo(function TokenSelect({ value, collapsed, disabled, onSelect }: TokenSelectProps) {
  usePrefetchBalances()

  const [open, setOpen] = useState(false)
  const onOpen = useCallback(() => setOpen(true), [])
  const selectAndClose = useCallback(
    (value: Currency) => {
      onSelect(value)
      setOpen(false)
    },
    [onSelect, setOpen]
  )
  return (
    <>
      <TokenButton value={value} collapsed={collapsed} disabled={disabled} onClick={onOpen} />
      {open && <TokenSelectDialog value={value} onSelect={selectAndClose} onClose={() => setOpen(false)} />}
    </>
  )
})
