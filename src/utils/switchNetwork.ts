import getInjectedProvider from './injectedProvider'

const defaultNativeCurrency = { name: 'Ether', symbol: 'ETH', decimals: 18 }

export default async function switchNetwork(
  chainId: number,
  chainName: string,
  rpcUrl: string,
  nativeCurrency = defaultNativeCurrency
) {
  const injectedProvider = getInjectedProvider()
  if (injectedProvider) {
    const chainIdHex = `0x${chainId.toString(16)}`

    try {
      await injectedProvider.send('wallet_switchEthereumChain', [{ chainId: chainIdHex }])
    } catch (error) {
      const { code } = error as { code: number }

      // This error code indicates that the chain has not been added to the wallet.
      if (code === 4902) {
        try {
          injectedProvider.send('wallet_addEthereumChain', [
            {
              chainId: chainIdHex,
              chainName,
              nativeCurrency,
              rpcUrls: [rpcUrl]
            }
          ])
        } catch (addError) {
          console.error(addError)
        }
      } else {
        console.error(error)
      }
    }
  }
}
