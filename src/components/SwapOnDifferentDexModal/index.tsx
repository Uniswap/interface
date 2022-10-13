import { CloseIcon, TYPE } from 'theme';
import styled, { useTheme } from 'styled-components/macro';

import { AutoColumn } from 'components/Column';
import { DarkCard } from 'components/Card';
import Modal from 'components/Modal';
import React from 'react';
import Select from 'react-select'
import { SwapTokenForTokenWithFactory } from './SwapWithDifferentFactory';

const SelectItem = styled(Select)`
    z-index:10;
    color:#222;
`

type Props = {
    isOpen: boolean;
    onDismiss: () => void;
}
export const SwapOnDifferentDexModal = (props: Props) => {
    const { isOpen, onDismiss } = props

    const [selectedRouter, setSelectedRouter] = React.useState<{ value: string, label: string }>({ value: '', label: '' })

    const supportedRouters = [
        { name: 'pancake-swap-eth', factory: '0x1097053Fd2ea711dad45caCcc45EfF7548fCB362', display: "PancakeSwap (ETH)" },
        { name: 'shibaswap-eth', factory: '0x115934131916c8b277dd010ee02de363c09d037c', display: "Shibaswap" },
       // { name: 'sushiswap-eth', factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', display: "Sushiswap" }
    ]

    const options = supportedRouters.map((router) => ({
        label: router.display,
        value: router.factory
    }))

    const setSelectedRouterCallback = React.useCallback((newValue: any) => {
        setSelectedRouter(newValue)
    }, [selectedRouter, setSelectedRouter])

    const theme = useTheme()
    const styles={color:theme.text1, background: theme.bg0};

    return (
        <Modal minHeight={60} maxHeight={150} isOpen={isOpen} onDismiss={onDismiss}>
            <DarkCard>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <h5>Swap Using a Different Router</h5>
                    <CloseIcon onClick={onDismiss} />
                </div>                    
                <AutoColumn gap="lg">
                    <AutoColumn gap="sm">
                        <TYPE.small>Select the dex you want to swap from </TYPE.small>
                        <SelectItem defaultMenuIsOpen className="text-dark" value={selectedRouter} onChange={setSelectedRouterCallback} options={options} />
                    </AutoColumn>

                    {selectedRouter.value !== '' && (
                        <AutoColumn gap="sm">
                            <SwapTokenForTokenWithFactory allowSwappingOtherCurrencies factory={selectedRouter.value} />
                        </AutoColumn>
                    )}
                </AutoColumn>
            </DarkCard>
        </Modal>
    )
}