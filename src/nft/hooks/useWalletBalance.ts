import { parseEther } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { useNativeCurrencyBalances } from 'state/connection/hooks'

export const useWalletBalance = () => {
  const { account: address, provider } = useWeb3React()
  const balanceString = useNativeCurrencyBalances(address ? [address] : [])?.[address ?? '']?.toSignificant(3) || '0'

  return address == null
    ? {
        address: '',
        balance: 0,
        weiBalance: parseEther('0'),
        provider: undefined,
      }
    : {
        address,
        balance: balanceString,
        weiBalance: parseEther(balanceString),
        provider,
      }
}
