import * as Transitions from 'react-transition-group'; // ES6

import { CSSTransition, TransitionGroup as ReactCSSTransitionGroup } from 'react-transition-group';

import { ChartComponent } from "./ChartComponent";
import { Dots } from "components/swap/styleds";
import Loader from "components/Loader";
import React from "react";
import _ from "lodash";
import { darken } from 'polished'
import styled from 'styled-components/macro'
import useLast from "hooks/useLast";

const Table = styled.table`
    width: 100%;
    border-radius:20px;
    background:
    ${props => `${props.theme.chartTableBg as string}`};
`
const Tr = styled.tr<{ item?: any, account?: any }>`
background:
${props => props.item?.account?.toLowerCase() == props.account?.toLowerCase()
        ? `#444`
        : `inherit`};
    padding-bottom: 5px;
    &:hover {
        opacity:0.8;
        transition: 0.1s ease all;
    }

    td {
        color ${props => props.theme.text1};
    }
    
`
type TableProps = {
    LastFetchedNode?: JSX.Element | null;
    pairs?: any[];
    formattedTransactions?: any[];
    chainId?: number;
    chainLabel?: string;
    tokenSymbol?: string;
    account?: string | null;
};


type RowProps = {
    item: any;
    account?: any;
    tokenSymbol?: any;
    index?: number;
    chainLabel?: any;
    first: boolean;
};
/* eslint-disable */
const ChartTableRow = React.memo(
    (props: RowProps) => {
        const { item, first, account, tokenSymbol, index, chainLabel } = props;
        /* eslint-disable */
        return React.useMemo(() => (
            <CSSTransition
                in={first}
                classNames={'example'}
                timeout={1000}
                onEnter={console.log}>
                    <Tr account={account} item={item}>
                    <td style={{ fontSize: 12 }}>
                        {new Date(item.timestamp * 1000).toLocaleString()}
                    </td>
                    {[item.token0Symbol, item.token1Symbol].includes(chainLabel) && (
                        <td
                            style={{
                                color:
                                    item.token0Symbol !==
                                        `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}`
                                        ? "#971B1C"
                                        : "#779681",
                            }}
                        >
                            {item.token0Symbol !==
                                `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}`
                                ? "SELL"
                                : "BUY"}
                        </td>
                    )}
                    {![item.token0Symbol, item.token1Symbol].includes(chainLabel) && (
                        <td
                            style={{
                                color:
                                    item.token1Symbol ===
                                        `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}`
                                        ? "#971B1C"
                                        : "#779681",
                            }}
                        >
                            {item.token1Symbol ===
                                `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}`
                                ? "SELL"
                                : "BUY"}
                        </td>
                    )}
                    {[item.token0Symbol, item.token1Symbol].includes(chainLabel) && (
                        <>
                            <td>
                                {item.token0Symbol === chainLabel && (
                                    <>
                                        {Number(+item.token0Amount?.toFixed(2))?.toLocaleString()}{" "}
                                        {item.token0Symbol}
                                    </>
                                )}
                                {item.token1Symbol === chainLabel && (
                                    <>
                                        {Number(+item.token1Amount?.toFixed(2))?.toLocaleString()}{" "}
                                        {item.token1Symbol}
                                    </>
                                )}
                            </td>
                            <td>
                                ${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}
                            </td>
                            <td>
                                {item.token0Symbol !== chainLabel && (
                                    <>
                                        {Number(+item.token0Amount?.toFixed(2))?.toLocaleString()}{" "}
                                        {item.token0Symbol}
                                    </>
                                )}
                                {item.token1Symbol !== chainLabel && (
                                    <>
                                        {Number(+item.token1Amount?.toFixed(2))?.toLocaleString()}{" "}
                                        {item.token1Symbol}
                                    </>
                                )}
                            </td>
                        </>
                    )}
                    {![item.token0Symbol, item.token1Symbol].includes(chainLabel) && (
                        <>
                            <td>
                                {item.token0Symbol !==
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(+item.token0Amount?.toFixed(2))?.toLocaleString()}{" "}
                                            {item.token0Symbol}
                                        </>
                                    )}
                                {item.token1Symbol !==
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(+item.token1Amount?.toFixed(2))?.toLocaleString()}{" "}
                                            {item.token1Symbol}
                                        </>
                                    )}
                            </td>
                            <td>
                                ${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}
                            </td>
                            <td>
                                {item.token0Symbol ===
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(+item.token0Amount?.toFixed(2))?.toLocaleString()}{" "}
                                            {item.token0Symbol}
                                        </>
                                    )}
                                {item.token1Symbol ===
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(+item.token1Amount?.toFixed(2))?.toLocaleString()}{" "}
                                            {item.token1Symbol}
                                        </>
                                    )}
                            </td>
                        </>
                    )}
                    <td>
                        <a
                            style={{ color: "#D57A47" }}
                            href={"https://etherscan.io/address/" + item.account}
                        >
                            {item.account &&
                                item.account.slice(0, 6) + "..." + item.account.slice(38, 42)}
                        </a>
                    </td>
                    <td>
                        <a
                            style={{ color: "#D57A47" }}
                            href={"https://etherscan.io/tx/" + item?.hash}
                        >
                            {item?.hash &&
                                item?.transaction?.id.slice(0, 6) +
                                "..." +
                                item?.transaction?.id.slice(38, 42)}
                        </a>
                    </td>
                    </Tr>
            </CSSTransition>
        ), [item, first, chainLabel, index, account, tokenSymbol])
    },
    (old, newP) => old.item.hash.toLowerCase() === newP.item.hash.toLowerCase()
);
ChartTableRow.displayName = "row";

ChartComponent.displayName = "CComponent";


const Thead = styled.thead`
text-align:left;
position:sticky;
top:0;
background: ${props=>props.theme.chartSidebar};
color: ${props => props.theme.text1};
width: 100%;`

/* eslint-disable */
export const ChartTable = React.memo((props: TableProps) => {
    const {
        account,
        tokenSymbol,
        formattedTransactions,
        pairs,
        chainId,
        chainLabel,
        LastFetchedNode,
    } = props;
    const hasData = Boolean(formattedTransactions?.length);
    const firstTx = useLast(formattedTransactions?.[0]?.hash);
    const txLength = formattedTransactions?.length;
    const hasNewTransaction =
        Boolean(firstTx) && formattedTransactions?.[0]?.hash !== firstTx;

    const Loading = React.useMemo(
        () => (
            !Boolean(formattedTransactions?.length) ? (
                <tr>
                    <td colSpan={7}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
                            <Dots> Loading transaction data</Dots>
                            <span><Loader /></span>
                        </div>
                    </td>
                </tr>
            ) : null
        ), [formattedTransactions])

    const items = _.uniqBy(
        formattedTransactions?.filter((item) => [item?.token0Symbol, item?.token1Symbol.includes(tokenSymbol)]),
        (a: any) => a.hash)
        ?.map((item: any, index: number) => (
            <ChartTableRow
                key={`${index}.${account}_${item.hash}`}
                first={index <=2}
                item={item}
                tokenSymbol={tokenSymbol}
                chainLabel={chainLabel}
                account={account}
                index={index}
            />
        ))
    const renderRows = React.useCallback(
        () => (
            <ReactCSSTransitionGroup
                component="tbody"
                transitionAppear={true}
                transitionAppearTimeout={1000}
                transitionName="example">
                {Loading}
                {items}
            </ReactCSSTransitionGroup>
        ), [
        formattedTransactions,
        hasNewTransaction,
        tokenSymbol,
        items,
        Loading
    ])

    return React.useMemo(
        () => (
            <div
                style={{
                    display: "block",
                    width: "100%",
                    overflowY: "auto",
                    maxHeight: 500,
                }}
            >
                {LastFetchedNode}
                <Table>
                    <Thead>
                        <tr style={{ borderBottom: "1px solid #444" }}>
                            <th>Date</th>
                            <th>Type</th>
                            <th>
                                Amt{" "}
                                {!chainId || chainId === 1
                                    ? pairs && pairs?.length
                                        ? pairs?.[0]?.token0?.symbol === tokenSymbol
                                            ? pairs?.[0]?.token1?.symbol
                                            : pairs?.[0]?.token0?.symbol
                                        : "WETH"
                                    : "BNB"}
                            </th>
                            <th>Amt USD</th>
                            <th>Amt Tokens</th>
                            <th>Maker</th>
                            <th>Tx</th>
                        </tr>
                    </Thead>
                    {renderRows()}
                </Table>
            </div>
        ),
        [
            Loading,
            renderRows(),
            pairs,
            LastFetchedNode,
            chainId
        ]
    );
}, (props, newProps) => _.isEqual(props.formattedTransactions, newProps.formattedTransactions));

ChartTable.displayName = "CHARTTABLE";
