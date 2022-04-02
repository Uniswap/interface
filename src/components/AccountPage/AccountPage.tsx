import { useWeb3React } from '@web3-react/core';
import Badge, { BadgeVariant } from 'components/Badge';
import { DarkCard } from 'components/Card';
import { Wrapper } from 'pages/Pool/styleds';
import { Transactions } from 'pages/Vote/TransactionsPage';
import React from 'react';
import { useEthPrice, useUserTransactions } from 'state/logs/utils';
import styled from 'styled-components/macro';
import _ from 'lodash'
import Web3 from 'web3';
import { ExternalLink, ExternalLinkIcon } from 'theme';
import { ButtonPrimary } from 'components/Button';
import { useUSDCValue } from 'hooks/useUSDCPrice';
import { BigintIsh, CurrencyAmount, Token, WETH9 } from '@uniswap/sdk-core';
import JSBI from 'jsbi'
import { parseEther } from '@ethersproject/units';
import { isMobile } from 'react-device-detect';
import { useKiba } from 'pages/Vote/VotePage';
import { binanceTokens } from 'utils/binance.tokens';
import { useParams } from 'react-router';
import { useETHBalances } from 'state/wallet/hooks';
const StyledHeader = styled.div`
font-size: ${isMobile ? '18px' : '32px'};
font-family: "Bangers", cursive;
margin:0; `

const TotalRow = ({ totalGasUSD, totalGasETH, account, transactions, txCount }: { totalGasUSD?: any, totalGasETH?: any, totalGasPaid?: CurrencyAmount<Token> | null, account: string, transactions: any[], txCount: number }) => {
    const total = React.useMemo(() => _.sumBy(transactions, i => +i.amountUSD), [transactions])
    return (
        <div style={{ paddingTop: 10, display: 'flex', gap: 10, flexFlow: 'row wrap', alignItems: 'center', justifyContent: 'stretch' }}>
            <div style={{ marginBottom: 5, justifyContent: 'start', flexFlow: 'column wrap', alignItems: 'center' }}>
                <StyledHeader># Swaps</StyledHeader>
                <Badge style={{ display:'flex', margin: 0, textAlign: 'right' }}>{Number(transactions?.length?.toFixed(2)).toLocaleString()}</Badge>
            </div>
            {totalGasUSD && totalGasUSD?.greaterThan(0) && <div style={{ marginBottom: 5, flexFlow: 'column wrap', alignItems: 'center' }}>
                <StyledHeader>Gas Swapped</StyledHeader>
                {totalGasETH && <Badge style={{ display:'flex', margin: 0, textAlign: 'right' }}>{Number(totalGasETH).toLocaleString()} ETH {totalGasUSD && <>(${(totalGasUSD).toFixed(2)} USD)</>} </Badge>}
            </div>}
            <div style={{ marginBottom: 5, justifyContent: 'start', flexFlow: 'column wrap', alignItems: 'center' }}>
                <StyledHeader>USD Swapped</StyledHeader>
                <Badge style={{display:'flex', margin: 0, textAlign: 'right' }}>${Number(total.toFixed(2)).toLocaleString()}</Badge>
            </div>
        </div>
    )
}

export const useHasAccess = (minimumTokensRequired = 1) => {
    const { account } = useWeb3React();
    const kibaBalance = useKiba(account);

    return React.useMemo(() => {
        if (account && kibaBalance) {
            const hasKibaTokens = +kibaBalance?.toFixed(0) >= minimumTokensRequired;
            return hasKibaTokens;
        }
        return false;
    }, [account, kibaBalance, minimumTokensRequired])
}

export const AccountPage = () => {
    const { account, library, chainId } = useWeb3React()
    const transactions = useUserTransactions(account)
    const [formattedTxns, setFormattedTxns] = React.useState<any[]>()
    const web3 = new Web3(library?.provider)
    const hasAccess = useHasAccess()
    React.useEffect(() => {
        if (transactions && transactions?.data && transactions?.data?.swaps && library?.provider) {
            Promise.all(transactions?.data?.swaps?.map(async (item: any) => {
                if (item) {
                const tx = await web3.eth.getTransaction(item?.transaction?.id);
                const txReceipt = await web3.eth.getTransactionReceipt(item?.transaction?.id)
                const payload = {
                    ...item,
                    cost: (parseFloat(tx?.gasPrice) * txReceipt?.gasUsed) / 10 ** 18,
                    gasUsed: txReceipt?.gasUsed,
                    gasPrice: tx?.gasPrice
                }
                return payload
            } else return {}
            })).then(setFormattedTxns)
        }
    }, [transactions.data, library])

    const totalGasUsed = React.useMemo(() => {
        if (formattedTxns && formattedTxns.length) {
            const totalGas = _.sumBy(formattedTxns, a => a.cost);
            return +totalGas.toFixed(9);
        }
        return 0
    }, [formattedTxns])


    const totalGasUSD = useUSDCValue(CurrencyAmount.fromRawAmount(chainId === 56 ? binanceTokens.wbnb : WETH9[1], totalGasUsed > 0 ? parseEther(totalGasUsed.toString()).toHexString() : '0'))
    const [txCount, setTxCount] = React.useState<number>(0)
    React.useEffect(() => {
        if (account) {
            web3.eth.getTransactionCount(account).then(setTxCount)
        }
    }, [account])
    if (!account) return null;

    return (
        <DarkCard style={{ maxWidth: 850, background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))' }}>
            <div style={{ display: 'flex', flexFlow: 'row wrap', marginBottom: 10, justifyContent: 'space-between' }}>
                <Badge><StyledHeader>Transaction History</StyledHeader></Badge>
                {hasAccess && <ExternalLink href={`https://etherscan.io/address/${account}`}>
                    <ButtonPrimary> View on explorer
                        <ExternalLinkIcon href={`https://etherscan.io/address/${account}`} />
                    </ButtonPrimary>
                </ExternalLink>}
            </div>
            <Wrapper style={{ background: '#222', padding: '9px 14px' }}>
                {hasAccess && (
                    <>
                        <Transactions loading={transactions.loading} error={transactions.error} transactions={formattedTxns} />
                        <TotalRow totalGasETH={totalGasUsed} totalGasUSD={totalGasUSD} account={account} txCount={txCount} transactions={transactions?.data?.swaps} />
                    </>
                )}
                {!hasAccess && <p style={{ height: 400, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>You must own Kiba Inu tokens to use this feature.</p>}
            </Wrapper>
        </DarkCard>
    )
}



export const AccountPageWithAccount = () => {
    const params = useParams<{account: string}>()
    const {account} = params;
    const {  library, chainId } = useWeb3React()
    const transactions = useUserTransactions(account)
    const [formattedTxns, setFormattedTxns] = React.useState<any[]>()
    const web3 = new Web3(library?.provider)
    const hasAccess = useHasAccess()
    const ethBalance = useETHBalances([account?.toLowerCase()])
    console.log(ethBalance)
    React.useEffect(() => {
        if (transactions && transactions?.data && transactions?.data?.swaps && library?.provider) {
            Promise.all(transactions?.data?.swaps?.map(async (item: any) => {
                if (item) {
                const tx = await web3.eth.getTransaction(item?.transaction?.id);
                const txReceipt = await web3.eth.getTransactionReceipt(item?.transaction?.id)
                const payload = {
                    ...item,
                    cost: (parseFloat(tx?.gasPrice) * txReceipt?.gasUsed) / 10 ** 18,
                    gasUsed: txReceipt?.gasUsed,
                    gasPrice: tx?.gasPrice
                }
                return payload
            } else return {}
            })).then(setFormattedTxns)
        }
    }, [transactions.data, library])

    const totalGasUsed = React.useMemo(() => {
        if (formattedTxns && formattedTxns.length) {
            const totalGas = _.sumBy(formattedTxns, a => a.cost);
            return +totalGas.toFixed(9);
        }
        return 0
    }, [formattedTxns])


    const totalGasUSD = useUSDCValue(CurrencyAmount.fromRawAmount(chainId === 56 ? binanceTokens.wbnb : WETH9[1], totalGasUsed > 0 ? parseEther(totalGasUsed.toString()).toHexString() : '0'))
    const [txCount, setTxCount] = React.useState<number>(0)
    React.useEffect(() => {
        if (account) {
            web3.eth.getTransactionCount(account).then(setTxCount)
        }
    }, [account])
    if (!account) return null;

    return (
        <DarkCard style={{ maxWidth: 850, background: 'radial-gradient(#f5b642, rgba(129,3,3,.95))' }}>
            <div style={{ display: 'flex', flexFlow: 'row wrap', marginBottom: 10, justifyContent: 'space-between',rowGap: 10, columnGap: 15 }}>
                <Badge><StyledHeader>Transaction History </StyledHeader></Badge>
                {hasAccess && <ExternalLink href={`https://etherscan.io/address/${account}`}>
                    <ButtonPrimary> View on explorer
                        <ExternalLinkIcon href={`https://etherscan.io/address/${account}`} />
                    </ButtonPrimary>
                </ExternalLink>}

                <Badge variant={BadgeVariant.POSITIVE} color={"#FFF"}>{account}</Badge>
                {ethBalance && ethBalance[account?.toLowerCase()] && <Badge variant={BadgeVariant.DEFAULT}>{ethBalance[account?.toLowerCase()]?.toSignificant(4)} ETH</Badge>}

            </div>
            <Wrapper style={{ background: '#222', padding: '9px 14px' }}>
                {hasAccess && (
                    <>
                        <Transactions accountValue={account} loading={transactions.loading} error={transactions.error} transactions={formattedTxns} />
                        <TotalRow totalGasETH={totalGasUsed} totalGasUSD={totalGasUSD} account={account} txCount={txCount} transactions={transactions?.data?.swaps} />
                    </>
                )}
                {!hasAccess && <p style={{ height: 400, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>You must own Kiba Inu tokens to use this feature.</p>}
            </Wrapper>
        </DarkCard>
    )
}