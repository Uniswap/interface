import {
    CSSTransition,
    TransitionGroup as ReactCSSTransitionGroup,
} from "react-transition-group";

import { ChartComponent } from "./ChartComponent";
import { Dots } from "components/swap/styleds";
import { FixedSizeList } from "react-window";
import Loader from "components/Loader";
import React from "react";
// Import React Table
import _ from "lodash";
import styled from "styled-components/macro";
import { useActiveWeb3React } from "hooks/web3";
import { useBscTokenTransactions } from "state/logs/bscUtils";
import { useIsDarkMode } from "state/user/hooks";
import useLast from "hooks/useLast";
import { useTokenTransactions } from "state/logs/utils";

const Table = styled.table`
  overflow:auto;
  width: 100%;
  border-radius: 20px;
  background: ${(props) => `${props.theme.chartTableBg as string}`};
`;
const Tr = styled.tr<{ highlight: string; item?: any; account?: any }>`
background:
${(props) =>
        props.item?.account?.toLowerCase() == props.account?.toLowerCase()
            ? `${props.highlight}`
            : `inherit`};
    padding-bottom: 5px;
    &:hover {
        opacity:0.8;
        transition: 0.1s ease all;
        cursor: pointer;
    }

    td {
        color ${(props) => props.theme.text1};
    }
    
`;
type TableProps = {
    LastFetchedNode?: JSX.Element | null;
    pairs?: any[];
    address: string;
    chainId?: number;
    chainLabel?: string;
    tokenSymbol?: string;
    account?: string | null;
    tableData?: any[];
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
const ChartTableRow = (props: RowProps) => {
    const darkMode = useIsDarkMode();
    const { item, first, account, tokenSymbol, index, chainLabel } = props;
    /* eslint-disable */
    return (
        <tr>
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
                    <td>${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}</td>
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
                    <td>${Number((+item?.amountUSD)?.toFixed(2)).toLocaleString()}</td>
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
        </tr>
    );
};

ChartComponent.displayName = "CComponent";

const Thead = styled.thead`
  font-size:12px;
  text-align: left;
  position: sticky;
  top: 0;
  background: ${(props) => props.theme.chartSidebar};
  color: ${(props) => props.theme.text1};
  width: 100%;
`;

/* eslint-disable */
export const ChartTable = React.memo((props: TableProps) => {
    const {
        account,
        tokenSymbol,
        address,
        pairs,
        chainId,
        chainLabel,
        tableData,
    } = props;

    const transactionData = useTokenTransactions(address, pairs, 15000);
    const bscTransactionData = useBscTokenTransactions(
        chainId && chainId == 56 ? address?.toLowerCase() : "",
        60000
    );

    const swaps = chainId == 1 ? transactionData?.data?.swaps : chainId == 56 ? bscTransactionData?.data?.swaps : [];

    const renderRow = React.useCallback((item: any, index: number) => {

    }, [tokenSymbol, account])

    const headerSymbol = !chainId || chainId === 1
        ? pairs && pairs?.length
            ? pairs[0]?.token0?.symbol === tokenSymbol
                ? pairs[0]?.token1?.symbol
                : pairs[0]?.token0?.symbol
            : "WETH"
        : "BNB";

    const render = () => (
        <></>
    )

    return <>{render()}</>
})

const TableHeader = React.memo(({ headerSymbol }: { headerSymbol: string }) => (
    <Thead>
        <tr style={{ borderBottom: "1px solid #444" }}>
            <th>Date</th>
            <th>Type</th>
            <th>
                Amt{" "} {headerSymbol}
            </th>
            <th>Amt USD</th>
            <th>Amt Tokens</th>
            <th>Maker</th>
            <th>Tx</th>
        </tr>
    </Thead>
))
TableHeader.displayName = "thead"

type _RowProps = {
     item: any;
     index: any; highlightedColor: any; account: any; chainLabel: any; tokenSymbol: any; 
}

const areRowsEqual = (rowProps:any, newRowProps :any) => {
    return rowProps?.item?.hash === newRowProps?.item?.hash?.toLowerCase()
}

const Row = React.memo((props: _RowProps ) => {
    const {index,item,highlightedColor, account, chainLabel, tokenSymbol} = props;
    if (index <= 2) {
        return (
            <CSSTransition
                key={`row_${index}_${item.transaction.id}`}
                in={true}
                classNames={"alert"}
                timeout={600}
            >
                <Tr highlight={highlightedColor} account={account} item={item}>
                    <td style={{ fontSize: 12 }}>
                        {new Date(item.timestamp * 1000).toLocaleString()}
                    </td>
                    {[item.token0Symbol, item.token1Symbol].includes(
                        chainLabel
                    ) && (
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
                    {![item.token0Symbol, item.token1Symbol].includes(
                        chainLabel
                    ) && (
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
                    {[item.token0Symbol, item.token1Symbol].includes(
                        chainLabel
                    ) && (
                            <>
                                <td>
                                    {item.token0Symbol === chainLabel && (
                                        <>
                                            {Number(
                                                +item.token0Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token0Symbol}
                                        </>
                                    )}
                                    {item.token1Symbol === chainLabel && (
                                        <>
                                            {Number(
                                                +item.token1Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token1Symbol}
                                        </>
                                    )}
                                </td>
                                <td>
                                    $
                                    {Number(
                                        (+item?.amountUSD)?.toFixed(2)
                                    ).toLocaleString()}
                                </td>
                                <td>
                                    {item.token0Symbol !== chainLabel && (
                                        <>
                                            {Number(
                                                +item.token0Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token0Symbol}
                                        </>
                                    )}
                                    {item.token1Symbol !== chainLabel && (
                                        <>
                                            {Number(
                                                +item.token1Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token1Symbol}
                                        </>
                                    )}
                                </td>
                            </>
                        )}
                    {![item.token0Symbol, item.token1Symbol].includes(
                        chainLabel
                    ) && (
                            <>
                                <td>
                                    {item.token0Symbol !==
                                        `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                            <>
                                                {Number(
                                                    +item.token0Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token0Symbol}
                                            </>
                                        )}
                                    {item.token1Symbol !==
                                        `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                            <>
                                                {Number(
                                                    +item.token1Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token1Symbol}
                                            </>
                                        )}
                                </td>
                                <td>
                                    $
                                    {Number(
                                        (+item?.amountUSD)?.toFixed(2)
                                    ).toLocaleString()}
                                </td>
                                <td>
                                    {item.token0Symbol ===
                                        `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                            <>
                                                {Number(
                                                    +item.token0Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
                                                {item.token0Symbol}
                                            </>
                                        )}
                                    {item.token1Symbol ===
                                        `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                            <>
                                                {Number(
                                                    +item.token1Amount?.toFixed(2)
                                                )?.toLocaleString()}{" "}
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
                                item.account.slice(0, 6) +
                                "..." +
                                item.account.slice(38, 42)}
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
        )
    } else {
        return (
            //
            <Tr highlight={highlightedColor} account={account} item={item} key={`row_${index}_${item.transaction.id}`} >
                <td style={{ fontSize: 12 }}>
                    {new Date(item.timestamp * 1000).toLocaleString()}
                </td>
                {[item.token0Symbol, item.token1Symbol].includes(
                    chainLabel
                ) && (
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
                {![item.token0Symbol, item.token1Symbol].includes(
                    chainLabel
                ) && (
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
                {[item.token0Symbol, item.token1Symbol].includes(
                    chainLabel
                ) && (
                        <>
                            <td>
                                {item.token0Symbol === chainLabel && (
                                    <>
                                        {Number(
                                            +item.token0Amount?.toFixed(2)
                                        )?.toLocaleString()}{" "}
                                        {item.token0Symbol}
                                    </>
                                )}
                                {item.token1Symbol === chainLabel && (
                                    <>
                                        {Number(
                                            +item.token1Amount?.toFixed(2)
                                        )?.toLocaleString()}{" "}
                                        {item.token1Symbol}
                                    </>
                                )}
                            </td>
                            <td>
                                $
                                {Number(
                                    (+item?.amountUSD)?.toFixed(2)
                                ).toLocaleString()}
                            </td>
                            <td>
                                {item.token0Symbol !== chainLabel && (
                                    <>
                                        {Number(
                                            +item.token0Amount?.toFixed(2)
                                        )?.toLocaleString()}{" "}
                                        {item.token0Symbol}
                                    </>
                                )}
                                {item.token1Symbol !== chainLabel && (
                                    <>
                                        {Number(
                                            +item.token1Amount?.toFixed(2)
                                        )?.toLocaleString()}{" "}
                                        {item.token1Symbol}
                                    </>
                                )}
                            </td>
                        </>
                    )}
                {![item.token0Symbol, item.token1Symbol].includes(
                    chainLabel
                ) && (
                        <>
                            <td>
                                {item.token0Symbol !==
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(
                                                +item.token0Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token0Symbol}
                                        </>
                                    )}
                                {item.token1Symbol !==
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(
                                                +item.token1Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token1Symbol}
                                        </>
                                    )}
                            </td>
                            <td>
                                $
                                {Number(
                                    (+item?.amountUSD)?.toFixed(2)
                                ).toLocaleString()}
                            </td>
                            <td>
                                {item.token0Symbol ===
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(
                                                +item.token0Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
                                            {item.token0Symbol}
                                        </>
                                    )}
                                {item.token1Symbol ===
                                    `${tokenSymbol == "ETH" ? "WETH" : tokenSymbol}` && (
                                        <>
                                            {Number(
                                                +item.token1Amount?.toFixed(2)
                                            )?.toLocaleString()}{" "}
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
                            item.account.slice(0, 6) +
                            "..." +
                            item.account.slice(38, 42)}
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
        )
    }
},areRowsEqual)

export const TableInstance = ({ tableData, tokenSymbol }: { tableData: any[], tokenSymbol: string }) => {
    const { account, chainId } = useActiveWeb3React()
    const darkMode = useIsDarkMode()
    const highlightedColor = React.useMemo(() => darkMode ? "#15223a" : "#afd9bd", [darkMode]);
    const chainLabel = chainId === 1 ? "WETH" : chainId == 56 ? "WBNB" : !chainId ? "WETH" : ''
    console.log(`table.data`, tableData)
    return (
        <div style={{
            maxHeight: 500,
            overflow: `auto`,
            marginTop: 5
        }}>
            <Table>
                <TableHeader headerSymbol={``} />
                <ReactCSSTransitionGroup
                    transitionName="alert"
                    component="tbody">
                    {tableData.map((item: any, index: number) => {
                        return <Row account={account}
                            chainLabel={chainLabel}
                            highlightedColor={highlightedColor}
                            index={index}
                            item={item}
                            tokenSymbol={tokenSymbol}
                            key={index} />
                    })}

                </ReactCSSTransitionGroup>
            </Table>
        </div>
    )
}
