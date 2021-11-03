import assert from 'assert'
import { useUpdateAtom } from 'jotai/utils'
import { DAI, ETH } from 'lib/mocks'
import { useEffect } from 'react'
import { useSelect } from 'react-cosmos/fixture'

import { Modal } from '../Dialog'
import Widget from '../Widget'
import { transactionAtom } from './state'
import { TransactionStatusDialog } from './TransactionStatus'

function Fixture() {
  const setTransaction = useUpdateAtom(transactionAtom)

  const [state] = useSelect('state', {
    options: ['PENDING', 'ERROR', 'SUCCESS'],
  })
  useEffect(() => {
    setTransaction({
      input: { token: ETH, value: 1 },
      output: { token: DAI, value: 4200 },
      receipt: '',
      timestamp: Date.now(),
    })
  }, [setTransaction])
  useEffect(() => {
    switch (state) {
      case 'PENDING':
        setTransaction({
          input: { token: ETH, value: 1 },
          output: { token: DAI, value: 4200 },
          receipt: '',
          timestamp: Date.now(),
        })
        break
      case 'ERROR':
        setTransaction((tx) => {
          assert(tx)
          tx.status = new Error(
            'Swap failed: Unknown error: "Error: This is an especially long string to demonstrate overflow behavior. It must be at least a few lines. One is too few. Two is too few. Three may work!"'
          )
          tx.elapsedMs = Date.now() - tx.timestamp
        })
        break
      case 'SUCCESS':
        setTransaction((tx) => {
          assert(tx)
          tx.status = true
          tx.elapsedMs = Date.now() - tx.timestamp
        })
        break
    }
  }, [setTransaction, state])
  return <TransactionStatusDialog onClose={() => void 0} />
}

export default (
  <Widget>
    <Modal color="dialog">
      <Fixture />
    </Modal>
  </Widget>
)
