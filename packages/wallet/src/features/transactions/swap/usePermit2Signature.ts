import { PermitSingle } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TypedDataField } from 'ethers'
import { useCallback } from 'react'
import { Permit } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useProvider, useWalletSigners } from 'wallet/src/features/wallet/context'
import { signTypedData } from 'wallet/src/features/wallet/signing/signing'

export type PermitSignatureInfo = {
  signature: string
  permitMessage: PermitSingle
  nonce: number
  expiry: number
}

// Used to sign permit messages where we already have the domain, types, and values.
export function usePermit2SignatureWithData({
  currencyInAmount,
  permitData,
  account,
  skip,
}: {
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  permitData: Maybe<Permit>
  account: AccountMeta
  skip?: boolean
}): {
  isLoading: boolean
  signature: string | undefined
} {
  const signerManager = useWalletSigners()
  const currencyIn = currencyInAmount?.currency
  const provider = useProvider(currencyIn?.chainId ?? UniverseChainId.Mainnet)

  const { domain, types, values } = permitData || {}

  const permitSignatureFetcher = useCallback(async () => {
    if (!provider || !currencyIn || skip || !domain || !types || !values) {
      return
    }

    return await signTypedData(
      domain,
      types as Record<string, TypedDataField[]>,
      values as Record<string, unknown>,
      account,
      signerManager,
    )
  }, [account, currencyIn, domain, provider, signerManager, skip, types, values])

  const { data, isLoading } = useAsyncData(permitSignatureFetcher)

  return {
    isLoading,
    signature: data,
  }
}
