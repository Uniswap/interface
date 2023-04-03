import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useMultichainPool } from 'hooks/bridge'
import { useBridgeState } from 'state/bridge/hooks'

const useGetPool = () => {
  const { chainId } = useActiveWeb3React()
  const [{ tokenInfoIn, tokenInfoOut, chainIdOut, listTokenOut }] = useBridgeState()
  const anyToken = tokenInfoOut?.fromanytoken

  const poolParamIn = useMemo(() => {
    const anytoken = tokenInfoOut?.isFromLiquidity && tokenInfoOut?.isLiquidity ? anyToken?.address : undefined
    const underlying = tokenInfoIn?.address
    return anytoken && underlying ? [{ anytoken, underlying }] : []
  }, [anyToken?.address, tokenInfoIn?.address, tokenInfoOut?.isFromLiquidity, tokenInfoOut?.isLiquidity])

  const poolParamOut = useMemo(() => {
    return listTokenOut
      .map(({ multichainInfo: token }) => ({
        anytoken: token?.isLiquidity ? token?.anytoken?.address : '',
        underlying: token?.underlying?.address ?? '',
      }))
      .filter(e => e.anytoken && e.underlying)
  }, [listTokenOut])

  const poolDataIn = useMultichainPool(chainId, poolParamIn)
  const poolDataOut = useMultichainPool(chainIdOut, poolParamOut)

  return { poolDataIn, poolDataOut }
}
export default useGetPool
