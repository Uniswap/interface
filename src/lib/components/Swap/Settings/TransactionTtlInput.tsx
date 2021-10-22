import { useAtom } from 'jotai'
import TYPE from 'lib/theme/type'
import { useRef } from 'react'

import Column from '../../Column'
import { IntegerInput } from '../../Input'
import Row from '../../Row'
import { transactionTtlAtom } from '../state'
import Label, { value } from './Label'

const tooltip = 'Your transaction will revert if it has not occured by this deadline.'

const Value = value(Row)

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useAtom(transactionTtlAtom)
  const input = useRef<HTMLInputElement>(null)
  return (
    <Column gap={0.75}>
      <Label name="Transaction Deadline" tooltip={tooltip} />
      <Value onClick={() => input.current?.focus()} cursor="text">
        <TYPE.subhead2>
          <IntegerInput value={transactionTtl} onChange={(value) => setTransactionTtl(value ?? 0)} ref={input} />
        </TYPE.subhead2>
        <TYPE.subhead2>Minutes</TYPE.subhead2>
      </Value>
    </Column>
  )
}
