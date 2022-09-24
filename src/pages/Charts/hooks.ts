import React, { useEffect, useState } from 'react'
import { getTaxesForBscToken, getTokenTaxes } from 'pages/HoneyUtils'

import { JsonRpcProvider } from '@ethersproject/providers'
import { getMaxes } from 'pages/HoneyPotDetector'
import { useActiveWeb3React } from 'hooks/web3'
import { useWeb3Endpoint } from './PairSearch'

export const useBuySellTax = (tokenAddress: string, network: string) => {
    const [state, setState] = useState<{
        buy: number | undefined | null,
        sell: number | undefined | null,
        honeypot: boolean | undefined | null
    }>()
    const formattedNetwork = network == 'ethereum' ? 'eth' : 'bsc2'
    const fragment = getMaxes
    useEffect(() => {
        if (network === 'bsc' || network === 'ethereum' || network === 'eth') {
            console.log(`[useBuySellTax] - fetching fragment of taxes / honeypot status`)
            fragment(tokenAddress, formattedNetwork).then((response) => {
                setState({
                    buy: response?.BuyTax,
                    sell: response?.SellTax,
                    honeypot: response?.IsHoneypot
                })
            })
        }
    }, [network, tokenAddress])

    if (network !== 'bsc' && network !== 'ethereum') return

    return state
}
