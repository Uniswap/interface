import { FeeOptions } from '@uniswap/v3-sdk'
import { atom, useAtom } from 'jotai'

const feeOptionsAtom = atom<FeeOptions | undefined>(undefined)

export default function useFeeOptions(): [FeeOptions | undefined, (feeOptions?: FeeOptions) => void] {
  return useAtom(feeOptionsAtom)
}
