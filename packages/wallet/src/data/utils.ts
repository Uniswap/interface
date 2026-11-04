import { createSignedRequestParams, objectToQueryString } from '@universe/api'
import { type Account } from 'wallet/src/features/wallet/accounts/types'
import { type SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

export const ON_RAMP_AUTH_MAX_LIMIT = 100
export const ON_RAMP_AUTH_MIN_LIMIT = 1

type OnRampTransactionsAuth = {
  queryParams: string
  signature: string
}

export async function createOnRampTransactionsAuth({
  limit,
  account,
  signerManager,
}: {
  limit: number
  account: Account
  signerManager: SignerManager
}): Promise<OnRampTransactionsAuth> {
  const { requestParams, signature } = await createSignedRequestParams({
    data: { limit }, // Signed alongside the address so the backend can verify the requested page size
    address: account.address,
    signMessage: generateSignerFunc(account, signerManager),
  })
  return { queryParams: objectToQueryString(requestParams), signature }
}
