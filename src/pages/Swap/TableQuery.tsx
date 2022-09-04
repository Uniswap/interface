import { Dots } from 'components/swap/styleds';
import Loader from 'components/Loader';
import React from 'react'
import { TableInstance } from './ChartTable';
import _ from 'lodash'
import { useTokenTransactions } from 'state/logs/utils';
export const TableQuery = ({ address, pairs, tokenSymbol }: { address: string, pairs: any[], tokenSymbol: string }) => {

    const [tableData, setTableData] = React.useState<any[]>();
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
                swap.to === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"
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
    const { data, loading } = useTokenTransactions(address, pairs, 15000)
    React.useEffect(() => {
        setTableData(() => [...formatTransactionData(data?.swaps)]);
    }, [data])

    if (loading || !tableData) {
        return <div>
            <Dots><Loader />&nbsp;Loading Transactions</Dots>
        </div>
    }

    return (
        <TableInstance tokenSymbol={tokenSymbol} tableData={tableData} />
    );
}