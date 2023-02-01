import { Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { AccountLayout, RawAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import connection from 'state/connection/connection'
import { useAllTransactions } from 'state/transactions/hooks'
import { isAddress, isWalletAddressSolana } from 'utils'
import { wait } from 'utils/retry'

export const useSOLBalance = (uncheckedAddress?: string): CurrencyAmount<Currency> | undefined => {
  const { chainId, account, isSolana } = useActiveWeb3React()
  const [solBalance, setSolBalance] = useState<CurrencyAmount<Currency> | undefined>(undefined)
  const allTransactions = useAllTransactions()

  useEffect(() => {
    let canceled = false
    let triedCount = 0
    const getBalance = async () => {
      if (!isSolana) return
      if (!account || !isAddress(chainId, account)) {
        setSolBalance(undefined)
        return
      }
      try {
        const publicKey = new PublicKey(account)
        if (publicKey) {
          const balance = await connection.getBalance(publicKey)
          if (canceled) return
          const balanceJSBI = JSBI.BigInt(balance)
          setSolBalance(prev => {
            if (prev === undefined || !JSBI.equal(balanceJSBI, prev.quotient))
              return CurrencyAmount.fromRawAmount(NativeCurrencies[chainId], balanceJSBI)
            return prev
          })
        } else {
          setSolBalance(prev => {
            if (prev !== undefined) return undefined
            return prev
          })
        }
      } catch (error) {
        await wait(100)
        if (!canceled && triedCount++ < 20) getBalance()
      }
    }
    getBalance()
    return () => {
      canceled = true
    }
  }, [allTransactions, account, chainId, isSolana, uncheckedAddress])

  return solBalance
}
type Overwrite<T, U> = Omit<T, keyof U> & U

type ParsedData = {
  data: RawAccount
}
type AccountInfoParsed = Overwrite<AccountInfo<any>, ParsedData> & {
  pubkey: PublicKey
}

export const useAssociatedTokensAccounts = (): { [mintAddress: string]: AccountInfoParsed } | null => {
  const { isSolana, account } = useActiveWeb3React()
  const allTransactions = useAllTransactions()
  const [atas, setAtas] = useState<{ [mintAddress: string]: AccountInfoParsed } | null>(null)

  useEffect(() => {
    if (!isSolana) return
    if (!account) return
    let canceled = false
    let triedCount = 0
    async function getTokenAccounts(publicKey: PublicKey) {
      try {
        const response = await connection.getTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        })
        if (canceled) return
        const atas: { [mintAddress: string]: AccountInfoParsed } = {}

        response.value.forEach(ata => {
          const parsedAccountData = AccountLayout.decode(ata.account.data)
          const parsedAta: AccountInfoParsed = {
            ...ata.account,
            pubkey: ata.pubkey,
            data: parsedAccountData,
          }
          atas[parsedAccountData.mint.toBase58()] = parsedAta
        })
        setAtas(atas)
      } catch (error) {
        console.error('get ata failed', { error })
        await wait(100)
        if (!canceled && triedCount++ < 20) getTokenAccounts(publicKey)
      }
    }

    getTokenAccounts(new PublicKey(account))
    return () => {
      canceled = true
    }
  }, [allTransactions, account, isSolana])

  return atas
}

export function useTokensBalanceSolana(tokens?: Token[]): [TokenAmount | undefined, boolean][] {
  // export const useTokensBalanceSolana = (
  //   validatedTokenAddresses: string[],
  // ): { [mintAddress: string]: TokenAmount | false } => {
  const atas = useAssociatedTokensAccounts()
  const [tokensBalance, setTokensBalance] = useState<{ [mintAddress: string]: TokenAmount | undefined }>({})
  const allTransactions = useAllTransactions()
  const tokensMap: { [mintAddress: string]: Token } = useMemo(() => {
    return (
      tokens?.reduce((acc, token) => {
        acc[token.address] = token
        return acc
      }, {} as { [address: string]: Token }) || {}
    )
  }, [tokens])

  useEffect(() => {
    const newTokensBalance: { [mintAddress: string]: TokenAmount | undefined } =
      tokens?.reduce((acc, token) => {
        acc[token.address] = undefined
        return acc
      }, {} as { [mintAddress: string]: TokenAmount | undefined }) || {}
    setTokensBalance(newTokensBalance)
  }, [allTransactions, tokens])

  useEffect(() => {
    async function getTokenAccounts() {
      if (!tokens) return
      if (!atas) return
      // Init all tokens balance by 0
      const newTokensBalance: { [mintAddress: string]: TokenAmount | undefined } = tokens.reduce((acc, token) => {
        acc[token.address] = CurrencyAmount.fromRawAmount(token, 0)
        return acc
      }, {} as { [mintAddress: string]: TokenAmount | undefined })

      tokens.forEach(token => {
        newTokensBalance[token.address] = CurrencyAmount.fromRawAmount(
          tokensMap[token.address],
          JSBI.BigInt(atas[token.address]?.data.amount.toString() || 0),
        )
      })

      setTokensBalance(newTokensBalance)
    }
    if (atas) {
      getTokenAccounts()
    }
  }, [allTransactions, atas, tokens, tokensMap])

  return useMemo(
    () => tokens?.map(token => [tokensBalance[token.address] || undefined, !tokensBalance[token.address]]) ?? [],
    [tokensBalance, tokens],
  )
}

export function useCheckAddressSolana(addr: string) {
  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    isWalletAddressSolana(addr)
      .then(() => {
        setAddress(addr)
      })
      .catch(() => setAddress(null))
      .finally(() => {
        setLoading(false)
      })
  }, [addr])

  return { address, loading }
}
