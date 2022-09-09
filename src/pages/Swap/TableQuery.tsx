import { toChecksum, useTokenTransactions } from 'state/logs/utils';

import BarChartLoaderSVG from 'components/swap/BarChartLoader';
import { Dots } from 'components/swap/styleds';
import Loader from 'components/Loader';
import React from 'react'
import { TableInstance } from './ChartTable';
import _ from 'lodash'
import { useActiveWeb3React } from 'hooks/web3';
import { useBscTokenTransactions } from 'state/logs/bscUtils';

export const TableQuery = ({ address, pairs, tokenSymbol }: { address: string, pairs: any[], tokenSymbol: string }) => {
    const { chainId } = useActiveWeb3React()
    const [tableData, setTableData] = React.useState<any[]>();
    const [bscTableData, setBscTableData] = React.useState<any[]>();
    const { data: bscData, loading: bscLoading } = useBscTokenTransactions(address?.toLowerCase())
    const formatTransactionData = (swaps: any[]) => {
        const newSwaps = swaps?.map((swap: any) => {
            const netToken0 = swap.amount0In - swap.amount0Out;
            const netToken1 = swap.amount1In - swap.amount1Out;
            const newTxn: Record<string, any> = {};
            if (netToken0 < 0) {
                newTxn.token0Symbol = swap.pair.token0.symbol;
                newTxn.token1Symbol = swap.pair.token1.symbol;
                newTxn.token0Amount = Math.abs(netToken0);
                newTxn.token1Amount = Math.abs(netToken1);
            } else if (netToken1 < 0) {
                newTxn.token0Symbol = swap.pair.token1.symbol;
                newTxn.token1Symbol = swap.pair.token0.symbol;
                newTxn.token0Amount = Math.abs(netToken1);
                newTxn.token1Amount = Math.abs(netToken0);
            }
            newTxn.transaction = swap.transaction;
            newTxn.hash = swap.transaction.id;
            newTxn.timestamp = swap.transaction.timestamp;
            newTxn.type = "swap";
            newTxn.amountUSD = swap.amountUSD;
            newTxn.account =
                // check if the router address is the swaps `to` property, meaning this was a sell
                [
                    "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
                    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
                    "0x25553828f22bdd19a20e4f12f052903cb474a335"
                ].some(item => item.toLowerCase() === swap.to.toLowerCase())
                    ? swap.from
                    : swap.to;
            return newTxn;
        });
        return _.uniqBy
            (
                newSwaps,
                (item: { hash?: string }) => item.hash?.toLowerCase()
            );
    }

    const { data, loading } = useTokenTransactions(address, pairs, 10000)

    React.useEffect(() => {
        setTableData(() => [...formatTransactionData(data?.swaps)]);
    }, [data])

    React.useEffect(() => {
        if (chainId && chainId == 56) {
            setBscTableData(() => [...formatTransactionData(bscData?.swaps)])
        }
    }, [bscData, chainId])


    const headerSymbol = !chainId || chainId === 1
        ? pairs && pairs?.length
            ? pairs[0]?.token0?.symbol === tokenSymbol
                ? pairs[0]?.token1?.symbol
                : pairs[0]?.token0?.symbol
            : "WETH"
        : "BNB";

    if (((!chainId || chainId == 1) && (loading)) ||
        (chainId == 56 && (bscLoading || !bscTableData))) {
        return (
            <>
                <div style={{
                    display: 'flex',
                    justifyContent: 'start',
                    alignItems: 'center',
                    flexFlow: 'column wrap',
                    gap: 5,
                    marginTop: 8,
                    width: "100%",
                    zIndex: 2
                }}>
                    <Dots>
                        <Loader />&nbsp;Loading Transactions
                    </Dots>
                </div>
                <BarChartLoaderSVG />
            </>
        )
    }

    if (tableData?.length == 0 && !loading) {
        return <div style={{
            display: 'flex',
            justifyContent: 'start',
            alignItems: 'center',
            flexFlow: 'column wrap',
            gap: 5,
            marginTop: 8,
            width: "100%",
            zIndex: 2
        }}> No results found </div>
    }

    return (
        <TableInstance headerSymbol={headerSymbol} tokenSymbol={tokenSymbol} tableData={(chainId == 56 && bscTableData ? bscTableData : tableData) as any[]} />
    );
}