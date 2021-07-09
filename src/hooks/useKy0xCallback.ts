import { ethers } from 'ethers'
import { signMessage, getNonces, computeNonceSigKDs } from '../utils/ky0x'
import { useActiveWeb3React } from './web3'

export function useWalletSigCallback(): { callback: null | (() => Promise<string>) } {
  const { account, library } = useActiveWeb3React()
  if (!account || !library) {
    throw new Error('PROVIDER_NOT_CONNECTED')
  }
  return {
    callback: async function signWallet(): Promise<string> {
      const walletSig = await signMessage(library, account)
      const hashWalletSig = ethers.utils.keccak256(walletSig)
      return hashWalletSig
    },
  }
}

export function useNonceSigCallback(): { callback: null | ((hashWalletSig: string) => Promise<string[]>) } {
  const { account, library } = useActiveWeb3React()
  if (!account || !library) {
    throw new Error('PROVIDER_NOT_CONNECTED')
  }
  return {
    callback: async function signNonceAndComputeKD(hashWalletSig: string): Promise<string[]> {
      const nonces = await getNonces(hashWalletSig, account, library)
      if (nonces.some((e) => e == ethers.constants.HashZero)) {
        throw new Error('No Ky0x Passport found.')
      }
      const uniqueNonces = [...new Set(nonces)]
      // prettier-ignore
      const uniqueNonceSigs: {[id: string]: string} = {}
      for (const n of uniqueNonces) {
        uniqueNonceSigs[n] = await signMessage(library, n)
      }
      const nonceSigs = nonces.map((nonce) => uniqueNonceSigs[nonce])
      const nonceSigKDs = computeNonceSigKDs(nonceSigs)
      if (!nonceSigKDs) {
        throw new Error('Error Computing Nonces')
      }
      return nonceSigKDs
    },
  }
}
