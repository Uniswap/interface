import { TYPE } from 'lib/styled'
import { useRef } from 'react'

import { IntegerInput } from '../../NumericInput'
import { useTransactionTtl } from '../state/hooks'
import { Bordered, Row } from './components'
import Label from './Label'

const tooltip = 'Your transaction will revert if it has not occured by this deadline.'

export default function TransactionTtlInput() {
  const [transactionTtl, setTransactionTtl] = useTransactionTtl()
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <Label name="Transaction Deadline" tooltip={tooltip} />
      <Row style={{ cursor: 'pointer' }} onClick={() => input.current?.focus()}>
        <Bordered style={{ justifyContent: 'space-between' }}>
          <TYPE.text>
            <IntegerInput value={transactionTtl} onUserInput={(value) => setTransactionTtl(value ?? 0)} ref={input} />
          </TYPE.text>
          <TYPE.text>Minutes</TYPE.text>
        </Bordered>
      </Row>
    </>
  )
}
