import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import styled, { ThemedText } from 'lib/theme'
import { useRef } from 'react'

import Column from '../../Column'
import { inputCss, IntegerInput } from '../../Input'
import Row from '../../Row'
import { transactionTtlAtom } from '../state'
import { Label } from './components'

const tooltip = <Trans>Your transaction will revert if it has been pending for longer than this period of time.</Trans>

const Input = styled(Row)`
  ${inputCss}
`

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useAtom(transactionTtlAtom)
  const input = useRef<HTMLInputElement>(null)
  return (
    <Column gap={0.75}>
      <Label name={<Trans>Transaction deadline</Trans>} tooltip={tooltip} />
      <Input onClick={() => input.current?.focus()}>
        <ThemedText.Body1>
          <IntegerInput value={transactionTtl} onChange={(value) => setTransactionTtl(value ?? 0)} ref={input} />
        </ThemedText.Body1>
        <ThemedText.Body1>
          <Trans>minutes</Trans>
        </ThemedText.Body1>
      </Input>
    </Column>
  )
}
