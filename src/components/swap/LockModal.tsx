import Modal from 'components/Modal'
import React from 'react'
import { X } from 'react-feather'

 export const LockModal = ({isOpen, setIsOpen}:{isOpen: boolean, setIsOpen: (val: boolean) => void }) => {

    return (
        <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)}>
            <iframe style={{width: '100%', height: 600}} src={'https://app.unicrypt.network/services/lock-liquidity'} />
        </Modal>
    )
 }