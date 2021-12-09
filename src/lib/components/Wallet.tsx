import { Clock } from 'lib/icons'
import { useMemo, useState } from 'react'

import { IconButton } from './Button'
import Dialog from './Dialog'
import RecentTransactionsDialog, { mockTxs, TransactionStatus } from './RecentTransactionsDialog'
import SpinnerIcon from './SpinnerIcon'

export default function Wallet() {
  const txs = mockTxs

  const [open, setOpen] = useState(false)
  const Icon = useMemo(() => {
    if (txs.length === 0) {
      return undefined
    }
    return txs.some(({ status }) => status === TransactionStatus.PENDING) ? SpinnerIcon : Clock
  }, [txs])
  if (Icon) {
    return (
      <>
        <IconButton onClick={() => setOpen(true)}>
          <Icon />
        </IconButton>
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
