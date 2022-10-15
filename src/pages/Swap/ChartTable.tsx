import '../Swap/transitions.css'

import {
    CSSTransition,
    TransitionGroup as ReactCSSTransitionGroup,
} from "react-transition-group";
import { Maximize, Minimize } from 'react-feather';

import { ChartComponent } from "./ChartComponent";
import { Dots } from "components/swap/styleds";
import { FixedSizeList } from "react-window";
import Loader from "components/Loader";
import React from "react";
import ReactFullscreen from 'react-easyfullscreen';
import {TYPE} from 'theme'
// Import React Table
import _ from "lodash";
import styled from "styled-components/macro";
import { useActiveWeb3React } from "hooks/web3";
import { useBscTokenTransactions } from "state/logs/bscUtils";
import { useIsDarkMode } from "state/user/hooks";
import { useIsMobile } from "./SelectiveCharting";

const Table = styled.table<{ isMobile: boolean }>`
  overflow:auto;
  width: 100%;
  height:100%;
  overflow-y:scroll;
  border-radius: 20px;
  background: ${(props) => `${props.theme.chartTableBg as string}`};
  td, th {font-size:${props => props.isMobile ? '9px' : '14px'};}
`;
const Tr = styled.tr<{ highlight: string; item?: any; account?: any }>`
background:
${(props) =>
        props.item?.account?.toLowerCase() == props.account?.toLowerCase()
            ? `${props.highlight}`
            : `inherit`};
    border-bottom:1px solid #444;
    padding-bottom: 5px;
    &:hover {
        opacity:0.8;
        transition: 0.1s ease all;
        cursor: pointer;
    }

    td {
        color: ${(props) => props.theme.text1};
    }
    &:last-of-type,
    &:last-child {
        border:none;
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
            <td>
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
                        item?.transaction?.id.slice(0, 3) +
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

const TableHeader = React.memo(({ headerSymbol, isMobile }: { headerSymbol: string, isMobile: boolean }) => (
    <Thead>
        <tr style={{ whiteSpace: isMobile ? "nowrap" : "normal", borderBottom: "1px solid #444" }}>
            <th>Date</th>
            <th>Type</th>
            <th>
                Amt{" "} {headerSymbol || "ETH"}
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
    isMobile: boolean;
    index: any; highlightedColor: any; account: any; chainLabel: any; tokenSymbol: any;
}

const areRowsEqual = (rowProps: _RowProps, newRowProps: _RowProps) => {
    return rowProps?.highlightedColor?.toLowerCase() === newRowProps.highlightedColor.toLowerCase() &&
        rowProps?.item?.hash?.toLowerCase() === newRowProps?.item?.hash?.toLowerCase()
}

const Row = React.memo((props: _RowProps) => {
    const { isMobile, index, item, highlightedColor, account, chainLabel, tokenSymbol } = props;
    const isItemSale = ['wbnb', 'bnb', 'weth', 'eth'].includes(item?.token0Symbol?.toLowerCase())
    if (index <= 2) {

        return (
            <CSSTransition
                key={`row_${index}_${item?.transaction?.id}`}
                in={true}
                classNames={"alert"}
                timeout={600}
            >
                <Tr highlight={highlightedColor} account={account} item={item}>
                    <td style={{ fontSize: isMobile ? 8 : 12 }}>
                        {new Date(item.timestamp * 1000).toLocaleString()}
                    </td>
                    {[item.token0Symbol, item.token1Symbol].includes(
                        chainLabel
                    ) && (
                            <td
                                style={{
                                    color:
                                        isItemSale
                                            ? "#971B1C"
                                            : "rgb(39 165 154)",
                                }}
                            >
                                {isItemSale
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
                                            : "rgb(39 165 154)",
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
                                <td style={{ whiteSpace: 'nowrap' }}>
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
                                <td style={{ whiteSpace: 'nowrap' }}>
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
                                item?.transaction?.id.slice(0, 3) +
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
                <td style={{ fontSize: isMobile ? 8 : 12 }}>
                    {new Date(item.timestamp * 1000).toLocaleString()}
                </td>
                {[item.token0Symbol, item.token1Symbol].includes(
                    chainLabel
                ) && (
                        <td
                            style={{
                                color:
                                    isItemSale
                                        ? "#971B1C"
                                        : "rgb(39 165 154)",
                            }}
                        >
                            {isItemSale
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
                                        : "rgb(39 165 154)",
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
                            <td style={{ whiteSpace: 'nowrap' }}>
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
}, areRowsEqual)

export const TableInstance = ({ network, tableData, tokenSymbol, headerSymbol }: { network: string, tableData: any[], tokenSymbol: string, headerSymbol: string }) => {
    const { account, chainId } = useActiveWeb3React()
    const darkMode = useIsDarkMode()
    const highlightedColor = React.useMemo(() => darkMode ? "#15223a" : "#afd9bd", [darkMode]);
    const chainLabel = React.useMemo(
        () => {
            if (network && network == 'ethereum') return 'WETH'
            if (network && network == 'bsc') return 'WBNB'
            return (!chainId || chainId === 1 ? `WETH` : chainId === 56 ? "WBNB" : "")
        },
        [chainId, network]
    );


    const [isMaxxed, setIsMaxxed] = React.useState(false)
    const Icon = function (onRequest: () => void, onExit: () => void) {
        const onClick = () => {
            const maxxed = !isMaxxed
            setIsMaxxed(maxxed)
            if (maxxed) {
                onRequest()
            } else {
                onExit()
            }
        }
        if (isMaxxed) {
            return <Minimize style={{ cursor: 'pointer' }} onClick={onClick} />
        } else {
            return <Maximize style={{ cursor: 'pointer' }} onClick={onClick} />
        }
    }

    const isMobile = useIsMobile()
    return (
        <ReactFullscreen>
            {({ ref, onRequest, onExit }) => (
                <div ref={ref as any} style={{
                    height: isMobile ? 500 : 600,
                    overflowX: `scroll`,
                    overflowY: `scroll`,
                    width: '100%',
                    marginTop: 5
                }}>

                    <Table isMobile={isMobile}>
                     
                    <thead>
                            <tr style={{height: 7,background:'transparent'}}>
                                <th  style={{height:10, background:'transparent'}} colSpan={7}>
                                    <div style={{ width: '95%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {Icon(onRequest, onExit)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <TableHeader isMobile={isMobile} headerSymbol={headerSymbol} />
                  
                        <ReactCSSTransitionGroup
                            component="tbody">
                            {tableData?.map((item: any, index: number) => {
                                return (
                                    <Row
                                        isMobile={isMobile}
                                        account={account}
                                        chainLabel={chainLabel}
                                        highlightedColor={highlightedColor}
                                        index={index}
                                        item={item}
                                        tokenSymbol={tokenSymbol}
                                        key={index} />
                                )
                            })}

                        </ReactCSSTransitionGroup>
                    </Table>
                </div>)}
        </ReactFullscreen>
    )
}
