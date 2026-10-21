import { useEvent } from 'utilities/src/react/hooks'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

/**
 * Migrate's review modal open state lives in the create-liquidity context, where opening it also locks
 * the range so an untouched preset can't move while the migration is being reviewed.
 */
export function useMigrateReviewModal({
  setTransactionError,
}: {
  setTransactionError: (error: string | boolean) => void
}) {
  const { isReviewModalOpen, setIsReviewModalOpen } = useCreateLiquidityContext()

  const openReviewModal = useEvent(() => setIsReviewModalOpen(true))
  const closeReviewModal = useEvent(() => {
    setIsReviewModalOpen(false)
    setTransactionError(false)
  })

  return { isReviewModalOpen, openReviewModal, closeReviewModal }
}
