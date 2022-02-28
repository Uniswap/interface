import React from 'react'
import Modal from 'components/Modal'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, usePoolDetailModalToggle } from 'state/application/hooks'
import { useSelectedPool } from 'state/pools/hooks'
import ItemCard from 'components/PoolList/ItemCard'

export default function PoolDetailModal() {
  const poolDetailModalOpen = useModalOpen(ApplicationModal.POOL_DETAIL)
  const togglePoolDetailModal = usePoolDetailModalToggle()
  const selectedPool = useSelectedPool()

  if (!selectedPool) {
    return null
  }

  return (
    <Modal
      isOpen={poolDetailModalOpen}
      onDismiss={togglePoolDetailModal}
      maxWidth="fit-content"
      maxHeight="fit-content"
    >
      <ItemCard
        poolData={selectedPool.poolData}
        myLiquidity={selectedPool.myLiquidity}
        isShowExpandedPools={false}
        isFirstPoolInGroup={true}
        isDisableShowTwoPools={false}
      />
    </Modal>
  )
}
