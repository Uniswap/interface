import { t, Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ChainId } from '@uniswap/smart-order-router'
import { COMMON_BASES } from 'constants/routing'
import styled, { ThemedText } from 'lib/theme'
import { ElementRef, useCallback, useEffect, useRef, useState } from 'react'
import { currencyId } from 'utils/currencyId'

import Column from '../Column'
import Dialog, { Header } from '../Dialog'
import { inputCss, StringInput } from '../Input'
import Row from '../Row'
import Rule from '../Rule'
import TokenBase from './TokenBase'
import TokenButton from './TokenButton'
import TokenOptions from './TokenOptions'
import useQueriedTokenList from './useQueriedTokenList'

const SearchInput = styled(StringInput)`
  ${inputCss}
`

export function TokenSelectDialog({ onSelect }: { onSelect: (token: Currency) => void }) {
  const baseTokens = COMMON_BASES[ChainId.MAINNET]

  const [query, setQuery] = useState('')
  const tokens = useQueriedTokenList(query)

  const input = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.focus(), [input])

  const [options, setOptions] = useState<ElementRef<typeof TokenOptions> | null>(null)

  // TODO(zzmp): Disable already selected tokens (passed as props?)

  return (
    <>
      <Header title={<Trans>Select a token</Trans>} />
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
        {Boolean(baseTokens.length) && (
          <>
            <Row pad={0.75} gap={0.25} justify="flex-start" flex>
              {baseTokens.map((token: Currency) => (
                <TokenBase value={token} onClick={onSelect} key={currencyId(token)} />
              ))}
            </Row>
            <Rule padded />
          </>
        )}
        <Rule padded />
      </Column>
      <TokenOptions tokens={tokens} onSelect={onSelect} ref={setOptions} />
    </>
  )
}

interface TokenSelectProps {
  value?: Currency | null | undefined
  collapsed: boolean
  disabled?: boolean
  onSelect: (value: Currency) => void
}

export default function TokenSelect({ value, collapsed, disabled, onSelect }: TokenSelectProps) {
  const [open, setOpen] = useState(false)
  const selectAndClose = useCallback(
    (value: Currency) => {
      onSelect(value)
      setOpen(false)
    },
    [onSelect, setOpen]
  )
  return (
    <>
      <TokenButton currency={value} collapsed={collapsed} disabled={disabled} onClick={() => setOpen(true)} />
      {open && (
        <Dialog color="module" onClose={() => setOpen(false)}>
          <TokenSelectDialog onSelect={selectAndClose} />
        </Dialog>
      )}
    </>
  )
}
