import { useEffect } from 'react'
import { useModalIsOpen } from 'state/application/hooks'
import { Flex, styled } from 'ui/src'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { usePrevious } from 'utilities/src/react/hooks'

export const LoadingRow = styled(Flex, {
  my: '$spacing16',
})

export function useRefetchOnLpModalClose(refetch: () => void) {
  const isAddLiquidityModalOpen = useModalIsOpen(ModalName.AddLiquidity)
  const isRemoveLiquidityModalOpen = useModalIsOpen(ModalName.RemoveLiquidity)
  const addLiquidityModalOpenPrev = usePrevious(isAddLiquidityModalOpen)
  const removeLiquidityModalOpenPrev = usePrevious(isRemoveLiquidityModalOpen)

  useEffect(() => {
    if (addLiquidityModalOpenPrev && !isAddLiquidityModalOpen) {
      refetch()
    }
    if (removeLiquidityModalOpenPrev && !isRemoveLiquidityModalOpen) {
      refetch()
    }
  }, [
    addLiquidityModalOpenPrev,
    removeLiquidityModalOpenPrev,
    isAddLiquidityModalOpen,
    isRemoveLiquidityModalOpen,
    refetch,
  ])
}
