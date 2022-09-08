import React from 'react'
import { useToken } from 'hooks/Tokens'
import { useTokenBalance } from 'state/wallet/hooks'

type AccountRowProps = {
    transaction: any
}

export const AccountTxValue = (props: AccountRowProps) => {
    const {transaction} = props
    const {token1, token0, account} = transaction
    const addressToken = token1.symbol.toLowerCase().includes('weth') || token1.symbol.toLowerCase() == 'eth' ? token0.id : token1.id
    const token = useToken(addressToken ?? undefined)
    const tokenBalance = useTokenBalance(account, token ?? undefined)

    return tokenBalance ? tokenBalance.toFixed(2) : ''
}