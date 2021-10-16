import { useAtom } from 'jotai'
import TYPE from 'lib/theme/type'
import { useRef } from 'react'

import Column from '../../Column'
import { IntegerInput } from '../../NumericInput'
import Row from '../../Row'
import { transactionTtlAtom } from '../state'
import Label, { Value } from './Label'

const tooltip = 'Your transaction will revert if it has not occured by this deadline.'

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useAtom(transactionTtlAtom)
  const input = useRef<HTMLInputElement>(null)
  return (
    <Column gap="0.75em">
      <Label name="Transaction Deadline" tooltip={tooltip} />
      <Value onClick={() => input.current?.focus()}>
        <Row>
          <TYPE.subhead2>
            <IntegerInput value={transactionTtl} onUserInput={(value) => setTransactionTtl(value ?? 0)} ref={input} />
          </TYPE.subhead2>
          <TYPE.subhead2>Minutes</TYPE.subhead2>
        </Row>
      </Value>
    </Column>
  )
}
