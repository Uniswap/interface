import 'setimmediate'

import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { loadingTransitionCss } from 'lib/css/loading'
import styled, { keyframes, ThemedText } from 'lib/theme'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Button from '../Button'
import Column from '../Column'
import { DecimalInput } from '../Input'
import Row from '../Row'
import TokenSelect from '../TokenSelect'

const TokenInputRow = styled(Row)`
  grid-template-columns: 1fr;
`

const ValueInput = styled(DecimalInput)`
  color: ${({ theme }) => theme.primary};
  height: 1em;

  :hover:not(:focus-within) {
    color: ${({ theme }) => theme.onHover(theme.primary)};
  }

  :hover:not(:focus-within)::placeholder {
    color: ${({ theme }) => theme.onHover(theme.secondary)};
  }

  ${loadingTransitionCss}
`

const delayedFadeIn = keyframes`
  0% {
    opacity: 0;
  }
  25% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const MaxButton = styled(Button)`
  animation: ${delayedFadeIn} 0.25s linear;
  border-radius: 0.75em;
  padding: 0.5em;
`

interface TokenInputProps {
  currency?: Currency
  amount: string
  max?: string
  disabled?: boolean
  onChangeInput: (input: string) => void
  onChangeCurrency: (currency: Currency) => void
  loading?: boolean
  children: ReactNode
}

export default function TokenInput({
  currency,
  amount,
  max,
  disabled,
  onChangeInput,
  onChangeCurrency,
  loading,
  children,
}: TokenInputProps) {
  const input = useRef<HTMLInputElement>(null)
  const onSelect = useCallback(
    (currency: Currency) => {
      onChangeCurrency(currency)
      setImmediate(() => input.current?.focus())
    },
    [onChangeCurrency]
  )

  const maxButton = useRef<HTMLButtonElement>(null)
  const hasMax = useMemo(() => Boolean(max && max !== amount), [max, amount])
  const [showMax, setShowMax] = useState<boolean>(hasMax)
  useEffect(() => setShowMax((hasMax && input.current?.contains(document.activeElement)) ?? false), [hasMax])
  const onBlur = useCallback((e) => {
    // Filters out clicks on input or maxButton, because onBlur fires before onClickMax.
    if (!input.current?.contains(e.relatedTarget) && !maxButton.current?.contains(e.relatedTarget)) {
      setShowMax(false)
    }
  }, [])
  const onClickMax = useCallback(() => {
    onChangeInput(max || '')
    setShowMax(false)
    setImmediate(() => {
      input.current?.focus()
      // Brings the start of the input into view. NB: This only works for clicks, not eg keyboard interactions.
      input.current?.setSelectionRange(0, null)
    })
  }, [max, onChangeInput])

  return (
    <Column gap={0.25}>
      <TokenInputRow gap={0.5} onBlur={onBlur}>
        <ThemedText.H2>
          <ValueInput
            value={amount}
            onFocus={() => setShowMax(hasMax)}
            onChange={onChangeInput}
            disabled={disabled || !currency}
            isLoading={Boolean(loading)}
            ref={input}
          ></ValueInput>
        </ThemedText.H2>
        {showMax && (
          <MaxButton onClick={onClickMax} ref={maxButton}>
            {/* Without a tab index, Safari would not populate the FocusEvent.relatedTarget needed by onBlur. */}
            <ThemedText.ButtonMedium tabIndex={-1}>
              <Trans>Max</Trans>
            </ThemedText.ButtonMedium>
          </MaxButton>
        )}
        <TokenSelect value={currency} collapsed={showMax} disabled={disabled} onSelect={onSelect} />
      </TokenInputRow>
      {children}
    </Column>
  )
}
