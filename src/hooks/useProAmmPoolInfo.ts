import { FeeAmount, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Currency, ChainId } from '@kyberswap/ks-sdk-core'
import { PRO_AMM_CORE_FACTORY_ADDRESSES, PRO_AMM_INIT_CODE_HASH } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'

export function useProAmmPoolInfos(
  currencyA: Currency | null | undefined,
  currencyB: Currency | null | undefined,
  feeAmount: (FeeAmount | undefined)[],
): string[] {
  const { chainId } = useActiveWeb3React()
  const proAmmCoreFactoryAddress = chainId && PRO_AMM_CORE_FACTORY_ADDRESSES[chainId]
  return feeAmount.map(fee => {
    return proAmmCoreFactoryAddress && currencyA && currencyB && fee
      ? computePoolAddress({
          factoryAddress: proAmmCoreFactoryAddress,
          tokenA: currencyA?.wrapped,
          tokenB: currencyB?.wrapped,
          fee: fee,
          initCodeHashManualOverride: PRO_AMM_INIT_CODE_HASH[chainId as ChainId],
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
