import { AutoColumn } from 'components/Column'
import { ButtonSecondary } from 'components/Button'
import { CFormInput } from '@coreui/react'
import { LightCard } from 'components/Card'
import Modal from 'components/Modal'
import React from 'react'
import Swal from 'sweetalert2'
import { TYPE } from 'theme'
import { X } from 'react-feather'
import { fetchDexscreenerToken } from 'components/swap/ChartPage'
import { isAddress } from '@ethersproject/address'
import { toChecksum } from 'state/logs/utils'

type TokenAddedPayload = {
    tokenAddress: string
    tokenSymbol: string
    network: string
    pairAddress: string
    tokenName: string
}

type Props = {
    isOpen: boolean
    onDismiss: () => void
    onTokenAdded: (item: TokenAddedPayload) => void
}

export const AddTokenToFavoritesModal = (props: Props) => {
    const { isOpen, onDismiss, onTokenAdded } = props

    const [address, setAddress] = React.useState('')

    const addTokenCallback = async () => {
        if (!isAddress(address)) {
            await Swal.fire({
                title: 'Error!',
                text: 'Please enter a valid contract address to add the token to your favorites list',
                icon: 'error'
            })
            return
        } else {
            const screenerToken = await fetchDexscreenerToken(address) as any

            const item = {
                tokenAddress: address,
                tokenName: screenerToken?.baseToken?.name,
                tokenSymbol: screenerToken?.baseToken?.symbol,
                pairAddress: screenerToken?.pairAddress,
                network: screenerToken?.chainId
            } as TokenAddedPayload

            onTokenAdded(item)

            onDismiss()
        }
    }

    return (
        <Modal isOpen={isOpen} onDismiss={onDismiss}>
            <LightCard>
            <AutoColumn gap="lg">
                <div style={{display:'flex',justifyContent:'space-between', alignItems:'center'}}>

                <TYPE.main>Add Token to Favorites by Address</TYPE.main>

                <X onClick={onDismiss} style={{cursor:'pointer'}} />
                </div>
                <AutoColumn gap="md">
                    <CFormInput placeholder={"Enter token address to add to favorites"} type="text" value={address} onChange={e => setAddress(e.target.value)} />

                    <ButtonSecondary onClick={addTokenCallback} style={{ padding: 3 }}>Add To Favorites</ButtonSecondary>
                </AutoColumn>
            </AutoColumn>
            </LightCard>
        </Modal>
    )
}