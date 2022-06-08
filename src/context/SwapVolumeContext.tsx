import { CurrencyAmount, WETH9 } from '@uniswap/sdk-core'
import React, {useCallback} from 'react'

import _ from 'lodash'
import { useCurrency } from 'hooks/Tokens'
import useInterval from 'hooks/useInterval'
import useLast from 'hooks/useLast'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useV2RouterContract } from 'hooks/useContract'
import { utils } from 'ethers'

const SwapVolumeContext = React.createContext<{volumeInEth?: string, volumeInEthBn?: number, volumeInUsd?: number}>({volumeInEth: '', volumeInEthBn: 0, volumeInUsd: 0}) 

export const SwapVolumeContextProvider = ({children, chainId}: {children:any, chainId: number | undefined}) => {
    const relayer = useV2RouterContract(chainId)
    const defaultState = {formatted:'0', value: 0};
      const [ethRelayed, setEthRelayed] = React.useReducer(function(state:any, action: {type: any,payload: any}) {
        switch(action.type) {
            case "UPDATE":
                return {
                    ...state,
                    ...action.payload
                };
            default:
                return state;
        }
      }, defaultState)
      const intervalFn =  ( 
          async (isIntervalledCallback: boolean ) => {
                console.log('interval function->totalSwapVolume->', ethRelayed.formatted)
                if (relayer && (isIntervalledCallback || !ethRelayed.value)) {
                    relayer.totalEthRelayed().then((response:any) => {
                        if (!_.isEqual(ethRelayed.value, response)) {
                            const formattedEth = parseFloat(utils.formatEther(response)).toFixed(6);
                            setEthRelayed({type: "UPDATE", payload: { formatted: formattedEth, value: response} });
                        }
                    })
                }
            }
      )
      const [initialized, setInitialized ] = React.useState(false)
      const intervalledFunction  = async () => await intervalFn(true)
      const priorChainId = useLast(chainId)
      let interval: NodeJS.Timeout;
      React.useEffect(( ) => {
        const needsRefetch = chainId && chainId != priorChainId;
        
        if (needsRefetch) 
            console.log(`Refetch swapVolume due to chainId change, prior: ${priorChainId}, current: ${chainId}`);
        
        if ((relayer && !initialized) || needsRefetch) {
            const finished = () => setInitialized(true)
            intervalFn(true).then(finished)
            // this will keep the swap volume consistently updating, every 5 minutes or so.
            if (null == interval)
                interval = setInterval(async () => {
                await intervalledFunction()
            }, 5 * 60000)
        }
        return () => {
            if (null != interval) clearInterval(interval)
        }
      } , [ relayer , initialized , chainId]) 
    
  
      const ethCurrency = useCurrency(WETH9[1].address)
  
      const rawCurrencyAmount = React.useMemo(() => {
        if (!ethRelayed.value || ethRelayed.formatted === '0' || !ethCurrency)
        return undefined
  
        return CurrencyAmount.fromRawAmount(ethCurrency ?? undefined, ethRelayed.value)
      }, [ethRelayed, ethCurrency])
  
      const usdcValue = useUSDCValue(rawCurrencyAmount)
      const formattedUsdcValue = usdcValue ? usdcValue?.toFixed(6) : '0';
      const value =  { 
        volumeInEth: ethRelayed.formatted,
        volumeInEthBn: ethRelayed.value,
        volumeInUsd: parseFloat(formattedUsdcValue)
      }
return (<SwapVolumeContext.Provider value={value}>
            {children}
        </SwapVolumeContext.Provider>)
}   

export const useSwapVolumeContext = () => {
    const context = React.useContext(SwapVolumeContext);
    if (!context) throw new Error(`Expected to be in SwapVolumeContext but was not`);
    return context;
}