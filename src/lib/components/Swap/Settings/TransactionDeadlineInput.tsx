import { useRef } from 'react'

import { TYPE } from '../../../themed'
import { IntegerInput } from '../../NumericInput'
import { useTransactionDeadline } from '../state/hooks'
import { Bordered, Row } from './components'
import Label from './Label'

const tooltip = 'Your transaction will revert if it has not occured by this deadline.'

export default function TransactionDeadlineInput() {
  const [transactionDeadline, setTransactionDeadline] = useTransactionDeadline()
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <Label name="Transaction Deadline" tooltip={tooltip} />
      <Row style={{ cursor: 'pointer' }} onClick={() => input.current?.focus()}>
        <Bordered style={{ justifyContent: 'space-between' }}>
          <TYPE.text>
            <IntegerInput
              value={transactionDeadline}
              onUserInput={(value) => setTransactionDeadline(value ?? 0)}
              ref={input}
            />
          </TYPE.text>
          <TYPE.text>Minutes</TYPE.text>
        </Bordered>
      </Row>
    </>
  )
}
