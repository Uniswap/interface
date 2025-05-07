import { EthMethod } from 'uniswap/src/features/dappRequests/types'

export const isSignTypedDataRequest = (request: { type: EthMethod }): boolean =>
  request.type === EthMethod.SignTypedData || request.type === EthMethod.SignTypedDataV4
