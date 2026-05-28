import { type PromiseClient } from '@connectrpc/connect'
import { type XVerificationService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/x_verification_connect'
import type {
  GetXAuthUrlRequest,
  GetXAuthUrlResponse,
  VerifyXCallbackRequest,
  VerifyXCallbackResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/x_verification_pb'

interface XVerificationServiceClientContext {
  rpcClient: PromiseClient<typeof XVerificationService>
}

export interface XVerificationServiceClient {
  getXAuthUrl: (params: GetXAuthUrlRequest) => Promise<GetXAuthUrlResponse>
  verifyXCallback: (params: VerifyXCallbackRequest) => Promise<VerifyXCallbackResponse>
}

export function createXVerificationServiceClient({
  rpcClient,
}: XVerificationServiceClientContext): XVerificationServiceClient {
  return {
    getXAuthUrl: (params) => rpcClient.getXAuthUrl(params),
    verifyXCallback: (params) => rpcClient.verifyXCallback(params),
  }
}
