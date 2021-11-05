import { icon } from 'lib/theme'
import { useMemo, useState } from 'react'
import { Clock } from 'react-feather'

import Button from './Button'
import Dialog from './Dialog'
import RecentTransactionsDialog, { mockTxs, TransactionStatus } from './RecentTransactionsDialog'
import SpinnerIcon from './SpinnerIcon'

const TransactionsIcon = icon(Clock)

export default function Wallet() {
  const txs = mockTxs

  const [open, setOpen] = useState(false)
  const Icon = useMemo(() => {
    if (txs.length === 0) {
      return undefined
    }
    return txs.some(({ status }) => status === TransactionStatus.PENDING) ? SpinnerIcon : TransactionsIcon
  }, [txs])
  if (Icon) {
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          <Icon />
        </Button>
        {open && (
          <Dialog color="module" onClose={() => setOpen(false)}>
            <RecentTransactionsDialog />
          </Dialog>
        )}
      </>
    )
  }
  return null
}
