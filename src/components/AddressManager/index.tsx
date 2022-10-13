import { ButtonGray, ButtonOutlined } from 'components/Button'
import { ChevronUp, X } from 'react-feather'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { DarkCard } from 'components/Card'
import Modal from 'components/Modal'
import Swal from 'sweetalert2'
import { TYPE } from 'theme'
import { isAddress } from 'utils'
import useLocalStorage from './hooks'
import useTheme from 'hooks/useTheme'

type Address = {
    label: string
    value: string
}

export const useAddressManager = () => {
    return useLocalStorage<{ label: string, value: string }[]>('kibaswap.addresses', [])
}

type AddressManagerProps = {
    isOpen: boolean;
    onDismiss: () => void;
}

export const AddressManager = (props: AddressManagerProps) => {
    const { isOpen, onDismiss } = props;
    const [current, setCurrent] = useAddressManager()

    const [isAdding, setIsAdding] = useState(false)

    const [addedItem, setAddedItem] = useState<Address>({ label: '', value: '' })

    const addNewAddress = (address: Address) => setCurrent([...current, address])

    const removeOldAddress = (address: Address) => setCurrent([...current.filter(add => add.value !== address.value)]);

    const AddressRow = (props: { item: Address, isLast: boolean, index: number }) => (
        <div style={{ height: 60, borderBottom: props.isLast ? 'none' : '1px solid #eee', width: '100%', display: 'flex', alignItems: 'center', flexFlow: 'row wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexFlow: "column wrap" }}>
                <div style={{ alignItems: 'center', display: 'grid', gridTemplateColumns: '15% 85%' }}>
                    <small>{props.index + 1}</small>
                    <div>
                        <p style={{ margin: 0 }}>{props.item.label}</p>
                        <small>{props.item.value}</small>
                    </div>
                </div>
            </div>
            <div>
                <ButtonOutlined onClick={() => removeOldAddress(props.item)}  style={{ padding: 9, fontSize: 14 }}>
                    <small> Remove</small>
                    <X size={16} />
                </ButtonOutlined>
            </div>
        </div>
    )

    const theme = useTheme()

    return (
        <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={70} maxHeight={130}>
            <DarkCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h5>Address Manager &nbsp; </h5>
                    <X style={{ cursor: 'pointer' }} onClick={onDismiss} />
                </div>

                <TYPE.link onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Cancel' : 'Add New Items'}</TYPE.link>
                <div style={{ color: theme.text1, background: theme.bg0, display: 'flex', gap: 15, alignItems: 'center', justifyContent: 'start', flexFlow: 'column wrap' }}>
                    {isAdding && (
                        <DarkCard>
                            <div style={{ width: '100%', padding: '1rem' }}>
                                <TYPE.subHeader fontSize={16}>Add a new address to be stored</TYPE.subHeader>
                                <br/>
                                <div style={{ marginBottom: 10, display: 'flex', flexFlow: 'column wrap' }}>
                                    <small>Label</small>
                                    <input type="text" value={addedItem?.label} onChange={(e) => setAddedItem({ ...addedItem, label: e.target.value })} />
                                </div>
                                <div style={{ marginBottom: 10, display: 'flex', flexFlow: 'column wrap' }}>
                                    <small>Address</small>
                                    <input type="text" value={addedItem?.value} onChange={(e) => setAddedItem({ ...addedItem, value: e.target.value })} />
                                </div>

                                <ButtonGray style={{ marginTop: 5, padding: 5 }} onClick={async () => {
                                    if (!isAddress(addedItem.value) && !addedItem.value.endsWith('.eth')) {
                                        await Swal.fire({
                                            title: "Invalid address",
                                            text: 'You must enter a valid address into the input to save it',
                                            icon: 'error'
                                        })
                                    } else {
                                        addNewAddress(addedItem)
                                        setIsAdding(false)
                                        setAddedItem({
                                            label: '',
                                            value: ''
                                        })
                                    }
                                }
                                }>
                                    Save
                                </ButtonGray>
                            </div>
                        </DarkCard>
                    )}

                    {!isAdding && (
                        <DarkCard  style={{display:'flex', alignItems:'center'}}>
                            {current.length === 0 && <small style={{textAlign:'center', width: '100%'}}>Add addresses for them to appear here</small>}
                            <div style={{ maxHeight: 400, overflow: 'scroll', width: '100%', padding: '1rem' }}>
                                {current.map((item, index) => (
                                    <AddressRow index={index} isLast={item === current[current.length - 1]} item={item} key={index} />
                                ))}
                            </div>
                        </DarkCard>
                    )}
                </div>
            </DarkCard>
        </Modal>

    )

}