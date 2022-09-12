import React, {useEffect, useState} from 'react'
import { getTaxesForBscToken, getTokenTaxes } from 'pages/HoneyUtils'

import { JsonRpcProvider } from '@ethersproject/providers'
import { useActiveWeb3React } from 'hooks/web3'
import { useWeb3Endpoint } from './PairSearch'

export const useBuySellTax = (tokenAddress: string, network: string) => {
    const {library} = useActiveWeb3React()

    const [state, setState] = useState<{
        buy: number | undefined | null,
        sell: number | undefined | null,
        honeypot: boolean | undefined | null
    }>()

    const networkChain = network == 'ethereum' ? 1 : 56
    const WEB3_ENDPOINT = useWeb3Endpoint(networkChain)
    const simpleProvider = new JsonRpcProvider(WEB3_ENDPOINT)

    const fragment = React.useMemo(() => network === 'bsc' ? getTaxesForBscToken : getTokenTaxes, [network])
    const provider = React.useMemo(() => library?.provider ? library?.provider : simpleProvider, [library])
    useEffect(() => {
        console.log(`in Effect`)
        fragment(tokenAddress, provider).then(setState)
    }, [network, tokenAddress])
    
    if (network !== 'bsc' && network !== 'ethereum') return

    return state
} 
