import { FeeAmount, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Currency, ChainId } from '@kyberswap/ks-sdk-core'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'constants/networks'

export function useProAmmPoolInfos(
  currencyA: Currency | null | undefined,
  currencyB: Currency | null | undefined,
  feeAmount: (FeeAmount | undefined)[],
): string[] {
  const { chainId } = useActiveWeb3React()
  const proAmmCoreFactoryAddress = chainId && NETWORKS_INFO[chainId].elastic.coreFactory
  return feeAmount.map(fee => {
    return proAmmCoreFactoryAddress && currencyA && currencyB && fee
      ? computePoolAddress({
          factoryAddress: proAmmCoreFactoryAddress,
          tokenA: currencyA?.wrapped,
          tokenB: currencyB?.wrapped,
          fee: fee,
          initCodeHashManualOverride: NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.initCodeHash,
        })
      : ''
  })
}

export default function useProAmmPoolInfo(
  currencyA: Currency | null | undefined,
  currencyB: Currency | null | undefined,
  feeAmount: FeeAmount | undefined,
): string {
  return useProAmmPoolInfos(currencyA, currencyB, [feeAmount])[0]
}
