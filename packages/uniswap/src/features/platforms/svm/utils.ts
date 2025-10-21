import { PublicKey } from '@solana/web3.js'

export const is32ByteBase58String = (input: string): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = new PublicKey(input)
    return true
  } catch {
    return false
  }
}
