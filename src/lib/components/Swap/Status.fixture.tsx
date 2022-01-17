import { useUpdateAtom } from 'jotai/utils'
import useToken from 'lib/cosmos/hooks/useToken'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { transactionAtom } from 'lib/state/swap'
import { useEffect } from 'react'
import { useSelect } from 'react-cosmos/fixture'
import invariant from 'tiny-invariant'

import { Modal } from '../Dialog'
import { StatusDialog } from './Status'

function Fixture() {
  const setTransaction = useUpdateAtom(transactionAtom)
  const [state] = useSelect('state', {
    options: ['PENDING', 'ERROR', 'SUCCESS'],
  })
  const nativeCurrency = useNativeCurrency()
  const token = useToken()
  useEffect(() => {
    setTransaction({
      input: { token: nativeCurrency, value: 1 },
      output: { token, value: 42 },
      receipt: '',
      timestamp: Date.now(),
    })
  }, [token, nativeCurrency, setTransaction])
  useEffect(() => {
    switch (state) {
      case 'PENDING':
        setTransaction({
          input: { token: nativeCurrency, value: 1 },
          output: { token, value: 42 },
          receipt: '',
          timestamp: Date.now(),
        })
        break
      case 'ERROR':
        setTransaction((tx) => {
          invariant(tx)
          tx.status = new Error(
            'Swap failed: Unknown error: "Error: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pulvinar, risus eu pretium condimentum, tellus dui fermentum turpis, id gravida metus justo ac lorem. Etiam vitae dapibus eros, nec elementum ipsum. Duis condimentum, felis vel tempor ultricies, eros diam tempus odio, at tempor urna odio id massa. Aliquam laoreet turpis justo, auctor accumsan est pellentesque at. Integer et dolor feugiat, sodales tortor non, cursus augue. Phasellus id suscipit justo, in ultricies tortor. Aenean libero nibh, egestas sit amet vehicula sit amet, tempor ac ligula. Cras at tempor lectus. Mauris sollicitudin est velit, nec consectetur lorem dapibus ut. Praesent magna ex, faucibus ac fermentum malesuada, molestie at ex. Phasellus bibendum lorem nec dolor dignissim eleifend. Nam dignissim varius velit, at volutpat justo pretium id."'
          )
          tx.elapsedMs = Date.now() - tx.timestamp
        })
        break
      case 'SUCCESS':
        setTransaction((tx) => {
          invariant(tx)
          tx.status = true
          tx.elapsedMs = Date.now() - tx.timestamp
        })
        break
    }
  }, [token, nativeCurrency, setTransaction, state])
  return <StatusDialog onClose={() => void 0} />
}

export default (
  <Modal color="dialog">
    <Fixture />
  </Modal>
)
