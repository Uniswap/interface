import useSWR from 'swr'

export enum MultichainTransferStatus {
  Processing = 0,
  Success = 1,
  Failure = 2,
}

export type MultichainTransfer = {
  id: number
  userAddress: string
  srcChainId: string
  dstChainId: string
  srcTxHash: string
  dstTxHash: string
  srcTokenSymbol: string
  dstTokenSymbol: string
  srcAmount: string
  dstAmount: string
  status: number
  createdAt: number
}

type Response = {
  code: number
  message: string
  data: {
    transfers: MultichainTransfer[]
    pagination: {
      totalItems: number
    }
  }
}

const useGetBridgeTransfers = (swrKey: string | null) => {
  return useSWR<Response>(
    swrKey,
    async (url: string) => {
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          return data
        }

        throw new Error(`No transfers found with url = ${swrKey}`)
      }

      throw new Error(`Fetching bridge transfers failed with url = ${swrKey}`)
    },
    { revalidateOnFocus: false, refreshInterval: 5_000 },
  )
}

export default useGetBridgeTransfers
