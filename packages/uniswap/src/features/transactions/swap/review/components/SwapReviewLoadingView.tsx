import { memo } from 'react'
import { Flex, SpinningLoader } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'

export const SwapReviewLoadingView = memo(function SwapReviewLoadingView(): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      {/* The value of `height + mb` must be equal to the height of the fully rendered component to avoid any jumps. */}
      <Flex centered height={377} mb="$spacing28">
        <SpinningLoader size={iconSizes.icon40} />
      </Flex>
    </TransactionModalInnerContainer>
  )
})
