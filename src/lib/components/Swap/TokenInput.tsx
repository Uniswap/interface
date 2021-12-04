import { Trans } from '@lingui/macro'
import styled, { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { FocusEvent, ReactNode, useCallback, useRef, useState } from 'react'

import Button from '../Button'
import Column from '../Column'
import { DecimalInput } from '../Input'
import Row from '../Row'
import TokenSelect from '../TokenSelect'
import { Input } from './state'

const TokenInputRow = styled(Row)`
  grid-template-columns: 1fr;
`

const MaxButton = styled(Button)`
  border-radius: 0.75em;
  padding: 0.5em;
`

interface TokenInputProps {
  input: Input
  onMax?: () => void
  onChangeInput: (input: number | undefined) => void
  onChangeToken: (token: Token) => void
  children: ReactNode
}

export default function TokenInput({
  input: { value, token },
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
    <Column gap={0.375}>
      <TokenInputRow gap={0.5} onBlur={onBlur}>
        <ThemedText.H2>
          <DecimalInput
            value={value}
            onFocus={onFocus}
            onChange={onChangeInput}
            placeholder="0.0"
            disabled={!token}
          ></DecimalInput>
        </ThemedText.H2>
        {showMax && (
          <MaxButton onClick={onMax} ref={max}>
            <ThemedText.ButtonMedium>
              <Trans>Max</Trans>
            </ThemedText.ButtonMedium>
          </MaxButton>
        )}
        <TokenSelect value={token} collapsed={showMax} onSelect={onChangeToken} />
      </TokenInputRow>
      {children}
    </Column>
  )
}
