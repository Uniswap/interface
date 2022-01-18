import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { Input } from 'lib/state/swap'
import styled, { keyframes, ThemedText } from 'lib/theme'
import { FocusEvent, ReactNode, useCallback, useRef, useState } from 'react'

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

  :hover:not(:focus-within) {
    color: ${({ theme }) => theme.onHover(theme.primary)};
  }

  :hover:not(:focus-within)::placeholder {
    color: ${({ theme }) => theme.onHover(theme.secondary)};
  }
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
  input: Input
  disabled?: boolean
  onMax?: () => void
  onChangeInput: (input: number | undefined) => void
  onChangeToken: (token: Currency) => void
  children: ReactNode
}

export default function TokenInput({
  input: { value, token },
  disabled,
  onMax,
  onChangeInput,
  onChangeToken,
  children,
}: TokenInputProps) {
  const max = useRef<HTMLButtonElement>(null)
  const [showMax, setShowMax] = useState(false)
  const onFocus = useCallback(() => setShowMax(Boolean(onMax)), [onMax])
  const onBlur = useCallback((e: FocusEvent) => {
    if (e.relatedTarget !== max.current) {
      setShowMax(false)
    }
  }, [])
  return (
    <Column gap={0.25}>
      <TokenInputRow gap={0.5} onBlur={onBlur}>
        <ThemedText.H2>
          <ValueInput
            value={value}
            onFocus={onFocus}
            onChange={onChangeInput}
            disabled={disabled || !token}
          ></ValueInput>
        </ThemedText.H2>
        {showMax && (
          <MaxButton onClick={onMax} ref={max}>
            <ThemedText.ButtonMedium>
              <Trans>Max</Trans>
            </ThemedText.ButtonMedium>
          </MaxButton>
        )}
        <TokenSelect value={token} collapsed={showMax} disabled={disabled} onSelect={onChangeToken} />
      </TokenInputRow>
      {children}
    </Column>
  )
}
