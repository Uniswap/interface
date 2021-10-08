import { TYPE } from '../../../themed'
import { useTransactionDeadline } from '../state/hooks'
import { Bordered, Row } from './components'
import Label from './Label'

export default function TransactionDeadlineInput() {
  const [transactionDeadline] = useTransactionDeadline()
  return (
    <>
      <Label name="Transaction Deadline" />
      <Row>
        <Bordered style={{ justifyContent: 'space-between' }}>
          <TYPE.text>{transactionDeadline}</TYPE.text>
          <TYPE.text>Minutes</TYPE.text>
        </Bordered>
      </Row>
    </>
  )
}
