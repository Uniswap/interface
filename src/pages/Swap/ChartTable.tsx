import '../Swap/transitions.css'

import {
    CSSTransition,
    TransitionGroup as ReactCSSTransitionGroup,
} from "react-transition-group";
import { Maximize, Minimize } from 'react-feather';

import React from "react";
import ReactFullScreenComponent from 'react-easyfullscreen';
// Import React Table
import _ from "lodash";
import styled from "styled-components/macro";
import { useActiveWeb3React } from "hooks/web3";
import { useIsDarkMode } from "state/user/hooks";
import { useIsMobile } from "./SelectiveCharting";

const Table = styled.table<{ isMobile: boolean }>`
  overflow: auto;
  width: 100%;
  height: 100%;
  overflow-y:scroll;
  overflow-x: scroll;
  border-radius: 20px;
  background: ${(props) => `${props.theme.chartTableBg as string}`};
  td, th {font-size:${props => props.isMobile ? '9px' : '14px'};}
`;
const Tr = styled.tr<{ highlight: string; item?: any; account?: any, darkMode?: boolean }>`
    background:
        ${(props) =>
        props.item?.account?.toLowerCase() == props.account?.toLowerCase()
            ? `${props.highlight}`
            : `inherit`};
    border-bottom: 1px solid ${(props) => props.darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}};

    &:hover {
        opacity:0.8;
        transition: 0.1s ease all;
        cursor: pointer;
    }

    &:last-of-type,
    &:last-child {
        border:none;
    }

    td {
        padding: 12px 5px 2px 5px;
    }

    &.sell td {
        color: ${(props) => props.darkMode ? 'rgb(224, 126, 132)' : 'rgb(189, 36, 43)'}}
    }

    &.buy td {
        color: ${(props) => props.darkMode ? 'rgb(173, 240, 207)' : 'rgb(59, 179, 63)'}}
    }
`;

const Thead = styled.thead`
  font-size:12px;
  text-align: left;
  position: sticky;
  top: 0;
  background: ${(props) => props.theme.chartSidebar};
  color: ${(props) => props.theme.text1};
  width: 100%;

  th {
    padding: 5px;
  }
`;

/* eslint-disable */

const TableHeader = React.memo(({ headerSymbol, isMobile, fullScreenButton }: { headerSymbol: string, isMobile: boolean, fullScreenButton: JSX.Element }) => (
    <Thead>
        <tr style={{ whiteSpace: isMobile ? "nowrap" : "normal", borderBottom: "1px solid #444" }}>
            <th>Date</th>
            <th>Type</th>
            <th>
                Amount {headerSymbol || "ETH"}
            </th>
            <th>Amount USD</th>
            <th>Amount Tokens</th>
            <th>Maker</th>
            <th>Tx</th>
            <th style={{ width: 24 }}>{fullScreenButton}</th>
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
    const isDarkMode = useIsDarkMode()

    if (index <= 2) {
        return (
            <CSSTransition
                key={`row_${index}_${item?.transaction?.id}`}
                in={true}
                classNames={"alert"}
                timeout={600}
            >
                <Tr
                    highlight={highlightedColor}
                    account={account}
                    item={item}
                    darkMode={isDarkMode}
                    className={isItemSale ? "sell" : "buy"}>
                    <td style={{ fontSize: isMobile ? 8 : 14 }}>
                        {new Date(item.timestamp * 1000).toLocaleString()}
                    </td>

                    <td style={{ fontWeight: '600' }}>
                        {isItemSale ? 'sell' : 'buy'}
                    </td>

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
                    <td></td>
                </Tr>
            </CSSTransition>
        )
    } else {
        return (
            <Tr
                highlight={highlightedColor}
                account={account}
                item={item}
                key={`row_${index}_${item.transaction.id}`}
                darkMode={isDarkMode}
                className={isItemSale ? "sell" : "buy"}>
                <td style={{ fontSize: isMobile ? 8 : 14 }}>
                    {new Date(item.timestamp * 1000).toLocaleString()}
                </td>

                <td style={{ fontWeight: '600' }}>
                    {isItemSale ? 'sell' : 'buy'}
                </td>

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
                <td></td>
            </Tr>
        )
    }
}, areRowsEqual)
export const FullScreenIcon = function (isMaxxed: boolean, isEnabled: boolean, onToggle: () => void, onRequest: () => void, onExit: () => void, style = {}) {
    const onClick = () => {
        const maxxed = !isMaxxed
        if (maxxed) {
            if (!isEnabled) {
                onRequest()
            } else {
                onToggle()
            }
        } else {
            onExit()
        }
    }
    if (isMaxxed) {
        return <Minimize style={{ ...style, cursor: 'pointer' }} onClick={onClick} />
    } else {
        return <Maximize style={{ ...style, cursor: 'pointer' }} onClick={onClick} />
    }
}

type Props = {
    childrenFn: (props: any) => React.ReactNode
    onMaxChange?: (maxxed: boolean) => void
}
export const FullScreenWrapper = (props: Props) => {
    const [isMaxxed, setIsMaxxed] = React.useState(false)
    const changeFn = () => {
        setIsMaxxed(maxxed => !maxxed)
    }

    React.useEffect(() => {
        props?.onMaxChange && props?.onMaxChange(isMaxxed)
    }, [props, isMaxxed])

    let content: JSX.Element
    const { childrenFn } = props
    const reportError = () => console.error(`React.FullScreen - errored out`)
    const _childrenFn = (propz: any) => <>{childrenFn(propz)}</>
    const defaultRef = React.useRef()

    if (!document?.fullscreenEnabled) {
        content = <div>
            <>{childrenFn({ isMaxxed, ref: defaultRef, onRequest: () => { return }, onExit: () => { return }, isEnabled: false, onToggle: () => { return } })}</>
        </div>
    } else {
        content = <ReactFullScreenComponent onChange={changeFn} onError={reportError}>
            {({ ref, onRequest, onExit, isEnabled, onToggle, }) => (
                <>{_childrenFn({ isMaxxed, ref, onRequest, onExit, isEnabled, onToggle })}</>
            )}
        </ReactFullScreenComponent>
    }

    return <>{content}</>
}

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
    const isMobile = useIsMobile()

    return (
        <FullScreenWrapper childrenFn={({ isMaxxed, ref, onRequest, onExit, isEnabled, onToggle, }) => (
            <div ref={ref as any} style={{
                height: isMobile ? 500 : 600,
                overflowX: `scroll`,
                overflowY: `scroll`,
                width: '100%'
            }}>
                <Table isMobile={isMobile}>
                    <TableHeader
                        isMobile={isMobile}
                        headerSymbol={headerSymbol}
                        fullScreenButton={FullScreenIcon(isMaxxed, isEnabled, onToggle, onRequest, onExit)} />

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
            </div>)} />
    )
}
