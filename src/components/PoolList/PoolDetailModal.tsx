import { Flex } from 'rebass'

import Modal from 'components/Modal'
import ItemCard from 'components/PoolList/ItemCard'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, usePoolDetailModalToggle } from 'state/application/hooks'
import { useSelectedPool } from 'state/pools/hooks'

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
      <Flex minWidth="375px" style={{ boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.04)' }}>
        <ItemCard poolData={selectedPool.poolData} myLiquidity={selectedPool.myLiquidity} />
      </Flex>
    </Modal>
  )
}
