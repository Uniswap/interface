import React from 'react'

import Modal from 'components/Modal'
import ItemCard from 'components/PoolList/ItemCard'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, usePoolDetailModalToggle } from 'state/application/hooks'
import { useSelectedPool } from 'state/pools/hooks'

export default function PoolDetailModal() {
  const poolDetailModalOpen = useModalOpen(ApplicationModal.POOL_DETAIL)
  const togglePoolDetailModal = usePoolDetailModalToggle()
  const selectedPool = useSelectedPool()
  const theme = useTheme()

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
        style={{ background: theme.tableHeader }}
        poolData={selectedPool.poolData}
        myLiquidity={selectedPool.myLiquidity}
        isShowExpandedPools={false}
        isFirstPoolInGroup={true}
        isDisableShowTwoPools={false}
      />
    </Modal>
  )
}
