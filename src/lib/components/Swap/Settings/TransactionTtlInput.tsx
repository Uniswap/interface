import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import { TRANSACTION_TTL_DEFAULT, transactionTtlAtom } from 'lib/state/settings'
import styled, { ThemedText } from 'lib/theme'
import { useRef } from 'react'

import Column from '../../Column'
import { inputCss, IntegerInput } from '../../Input'
import Row from '../../Row'
import { Label } from './components'

const tooltip = <Trans>Your transaction will revert if it has been pending for longer than this period of time.</Trans>

const placeholder = TRANSACTION_TTL_DEFAULT.toString()

const Input = styled(Row)`
  ${inputCss}
`

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useAtom(transactionTtlAtom)
  const input = useRef<HTMLInputElement>(null)
  return (
    <Column gap={0.75}>
      <Label name={<Trans>Transaction deadline</Trans>} tooltip={tooltip} />
      <ThemedText.Body1>
        <Input justify="start" onClick={() => input.current?.focus()}>
          <IntegerInput
            placeholder={placeholder}
            value={transactionTtl?.toString() ?? ''}
            onChange={(value) => setTransactionTtl(value ? parseFloat(value) : 0)}
            size={Math.max(transactionTtl?.toString().length || 0, placeholder.length)}
            ref={input}
          />
          <Trans>minutes</Trans>
        </Input>
      </ThemedText.Body1>
    </Column>
  )
}
