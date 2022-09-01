import { Button } from "rebass"
import { DarkCard } from "components/Card"
import Modal from "components/Modal"
import { PairSearch } from "./PairSearch"
import { TYPE } from "theme"
import { X } from "react-feather"
import styled from "styled-components/macro"
type ChartSearchModalProps = {
    isOpen: boolean;
    onDismiss: () => void
}

const Header = styled.div`
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:1rem;
    border-bottom:1px solid #444;
    font-size:18px;
`

export const ChartSearchModal = (props: ChartSearchModalProps) => {
    const { isOpen, onDismiss } = props
    const onPairSelect = (pair: any) => onDismiss()
    return ( 
        <Modal isOpen={isOpen} onDismiss={onDismiss}>
            <DarkCard>
                <Header>
                    <TYPE.black>Search by Name, Symbol, or Address</TYPE.black>
                    <X size={25} onClick={onDismiss} style={{cursor:'pointer', color:'#fff'}} />
                </Header>
                <PairSearch onPairSelect={onPairSelect} />
            </DarkCard>
        </Modal>
    )
}