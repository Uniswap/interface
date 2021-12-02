import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import { ThemedText } from 'lib/theme'
import { useRef } from 'react'

import Column from '../../Column'
import { IntegerInput } from '../../Input'
import Row from '../../Row'
import { transactionTtlAtom } from '../state'
import Label, { value } from './Label'

const tooltip = <Trans>Your transaction will revert if it has been pending for longer than this period of time.</Trans>

const Value = value(Row)

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useAtom(transactionTtlAtom)
  const input = useRef<HTMLInputElement>(null)
  return (
    <Column gap={0.75}>
      <Label name={<Trans>Transaction Deadline</Trans>} tooltip={tooltip} />
      <Value onClick={() => input.current?.focus()} cursor="text">
        <ThemedText.Subhead2>
          <IntegerInput value={transactionTtl} onChange={(value) => setTransactionTtl(value ?? 0)} ref={input} />
        </ThemedText.Subhead2>
        <ThemedText.Subhead2>
          <Trans>Minutes</Trans>
        </ThemedText.Subhead2>
      </Value>
    </Column>
  )
}
