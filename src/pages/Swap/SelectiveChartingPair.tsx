/*eslint-disable*/
/*tslint-disable*/
import "./transitions.css";

import {
    ArrowUpRight,
    Code,
    TrendingDown,
    TrendingUp,
} from "react-feather";
import { ButtonOutlined, ButtonSecondary } from "components/Button"
import { Currency, Token } from "@uniswap/sdk-core";
import { DarkCard } from "components/Card";
import { EmbedModel, useIsEmbedMode } from "components/Header";
import React, { useEffect, useState } from "react";
import { TYPE } from "theme";
import styled, { useTheme } from "styled-components/macro";
import {
    toChecksum,
    useEthPrice,
    useSetTitle,
    useTokenData,
    useTokenTransactions,
    useTokensFromPairAddress,
} from "state/logs/utils";
import { useBnbPrices, useBscTokenTransactions } from "state/logs/bscUtils";
import { useCurrency, useToken } from "hooks/Tokens";
import { useDexscreenerPair, useDexscreenerToken, useTokenInfo } from "components/swap/ChartPage";
import { useIsDarkMode, useUserChartHistoryManager } from "state/user/hooks";
import { useLocation, useParams } from "react-router";

import BarChartLoaderSVG from "components/swap/BarChartLoader";
import { ChartWrapper } from "components/earn/styled";
import { ChartComponent } from "./ChartComponent";
import { ChartSearchModal } from "pages/Charts/ChartSearchModal";
import { ChartSidebar } from "components/ChartSidebar";
import { LoadingSkeleton } from "pages/Pool/styleds";
import { PageMeta } from "./PageMeta";
import ReactGA from "react-ga";
import { RecentlyViewedCharts } from "./RecentViewedCharts";
import { SelectiveChartEmbedModal } from './SelectiveChartEmbed'
import Swal from 'sweetalert2'
import { TableQuery } from "./TableQuery";
import TokenSocials from "./TokenSocials";
import { TokenStats } from "./TokenStats";
import { TopTokenHolders } from "components/TopTokenHolders/TopTokenHolders";
import _ from "lodash";
import { useBuySellTax } from "pages/Charts/hooks";
import { useConvertTokenAmountToUsdString } from "pages/Vote/VotePage";
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useHistory } from "react-router-dom";
import { useTokenBalance } from "state/wallet/hooks";
import { useWeb3React } from "@web3-react/core";

export const useIsMobile = () => {
    const [width, setWidth] = useState(window.innerWidth);
    const handleWindowSizeChange = () => {
        setWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);

    return (width <= 768);
}

const CurrencyInputPanel = React.lazy(() => import("components/CurrencyInputPanel"));

const Badge = React.lazy(() => import("components/Badge"));

const DoubleCurrencyLogo = React.lazy(() => import("components/DoubleLogo"));

export function useLocationEffect(callback: (location?: any) => any) {
    const location = useLocation();

    React.useEffect(() => {
        callback(location);
    }, [location, callback]);
}
const StyledDiv = styled.div<{ isMobile?: boolean }>`
  font-family: "Open Sans";
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: ${props => props.isMobile ? "stretch" : "center"};
  padding: 3px 8px;
  flex-flow: ${(props) => (props.isMobile ? "column wrap" : "row wrap")};
`;

const WrapperCard = styled(DarkCard) <{ embedModel: EmbedModel, darkMode?: boolean, gridTemplateColumns: string, isMobile: boolean }>`
  background: ${props => props.darkMode ? props.theme.chartBgDark : !props.darkMode ? props.theme.chartBgLight : props.theme.chartTableBg};
  max-width: 100%;
  display: grid;
  ${props => props.theme.mediaWidth.upToSmall`
    ${props.embedModel.embedMode ? props.embedModel.showTrending ? `padding-top:2rem;` : `margin-top:-5px;` : ''}
  `}
  color ${props => props.theme.text1};
  grid-template-columns: ${props => props.gridTemplateColumns};
  border-radius: ${props => props.embedModel.embedMode ? '0px' : '30px'};
  padding:${(props) => props.isMobile ? '.01rem 5px' : '1rem'}
`

export const SelectiveChartWithPair = () => {
    const ref = React.useRef<any>();
    const { account, chainId } = useWeb3React();
    const history = useHistory();
    const [copied, copy] = useCopyClipboard()
    const params = useParams<{
        pairAddress?: string;
        network: string;
    }>();
    const pairedTokens = useTokensFromPairAddress(params?.pairAddress || '')
    const network = params?.network;
    const screenerPairChainId = network == 'bsc' ? 56 : network == 'ethereum' ? 1 : 1
    const screenerPair = useDexscreenerPair(toChecksum(params?.pairAddress) || '', screenerPairChainId)
    const isMobile = useIsMobile()
    const fallbackFromPair = React.useMemo(() => ({
        name: pairedTokens?.data?.token0?.name,
        symbol: pairedTokens?.data?.token0?.symbol,
        decimals: parseInt(pairedTokens?.data?.token0?.decimals || '18'),
        address: pairedTokens?.data?.token0?.id,
        chainId: screenerPairChainId,
        isToken: true
    } as Token), [pairedTokens?.data?.token0])
    const theAddress = React.useMemo(() => {
        return screenerPair?.baseToken?.address ?
            screenerPair?.baseToken?.address :
            fallbackFromPair?.address
    }, [screenerPair, fallbackFromPair])
    const mainnetCurrency = useCurrency(
        theAddress
    )
    const bscTransactionData = useBscTokenTransactions(
        params?.network == 'bsc' ? screenerPair?.baseToken?.address || '' : '',
        network,
        5000,
        params?.network == 'bsc' ? params?.pairAddress : ''
    )
    const prebuiltCurrency = React.useMemo(
        () => mainnetCurrency ? mainnetCurrency : fallbackFromPair,
        [mainnetCurrency, fallbackFromPair]
    );
    const tokenAddressSupplied = React.useMemo(
        () =>
            toChecksum(screenerPair?.baseToken?.address),
        [screenerPair?.baseToken?.address]
    );
    const [address, setAddress] = React.useState(
        tokenAddressSupplied ? tokenAddressSupplied : ""
    );

    useEffect(() => {
        if (screenerPair?.baseToken?.address && !_.isEqual(screenerPair?.baseToken?.address, address)) {
            setAddress(screenerPair?.baseToken?.address)
        }
    }, [screenerPair?.baseToken?.address])

    const tokenInfo = useTokenInfo(screenerPairChainId, address);
    const embedModel = useIsEmbedMode()
    const tokenData = useTokenData(address?.toLowerCase(), 7000);
    const { pairs } = tokenData;
    const token = useToken(address);
    const tokenBalance = useTokenBalance(account ?? undefined, token as any);
    const [ethPrice] = useEthPrice()
    const screenerToken = useDexscreenerToken(address);
    const transactionData = useTokenTransactions(address, pairs, 1500);
    const buySellTax = useBuySellTax(address, network)
    const [selectedCurrency, setSelectedCurrency] = React.useReducer(
        function (
            state: { selectedCurrency: Currency | null | undefined },
            action: { type: "update"; payload: Currency | null | undefined }
        ) {
            switch (action.type) {
                case "update":
                    return {
                        ...state,
                        selectedCurrency: action.payload,
                    };
                default:
                    return state;
            }
        },
        {
            selectedCurrency: prebuiltCurrency,
        }
    );
    const hasSelectedData = Boolean(params?.pairAddress);
    const theme = useTheme()
    const [loadingNewData, setLoadingNewData] = React.useState(false);

    // if they change chains on a chart page , need to redirect them back to the select charts page
    const [userChartHistory, updateUserChartHistory] =
        useUserChartHistoryManager();


    React.useEffect(() => {
        if (Object.keys(params).every((key) => !Boolean((params as any)[key]))) {
            setSelectedCurrency({ payload: undefined, type: "update" });
            ref.current = undefined;
        } else if (
            params.pairAddress &&
            (mainnetCurrency || screenerPair?.baseToken)
            && (screenerPair?.pairAddress === params.pairAddress)
        ) {
            // send event to analytics
            ReactGA.event({
                category: "Charts",
                action: `View`,
                label: `${screenerPair?.baseToken?.name}:${screenerPair?.baseToken?.symbol}/${screenerPair?.quoteToken?.name}:${screenerPair?.quoteToken?.symbol}`,
            });
            updateUserChartHistory([
                {
                    time: new Date().getTime(),
                    data: [],
                    token: {
                        ...screenerPair?.baseToken,
                        ...mainnetCurrency,
                        wrapped: undefined
                    },
                    summary: `Viewing ${screenerPair?.baseToken?.name} token chart`,
                    chainId,
                    network: screenerPair?.chainId,
                    pair: params.pairAddress
                },
            ]);
        }
    }, [screenerPair?.pairAddress, screenerPair?.baseToken]);

    const pair = React.useMemo(
        function () {
            if (screenerPair && screenerPair.quoteToken && screenerPair.quoteToken.address)
                return screenerPair.quoteToken.address

            if (screenerToken && screenerToken.quoteToken && screenerToken.quoteToken.address)
                return screenerToken.quoteToken.address

            if (!Boolean(Array.isArray(pairs) && pairs.length) && !screenerPair && !screenerToken)
                return undefined

            return `${pairs?.[0]?.token0?.symbol?.toLowerCase() ===
                token?.symbol?.toLowerCase()
                ? pairs?.[0]?.token1?.id
                : pairs?.[0]?.token0?.id
                }`;
        },
        [tokenData, params?.pairAddress, screenerToken, pairs, token]
    );

    const usdcAndEthFormatted = useConvertTokenAmountToUsdString(
        React.useMemo(() => token ? token as Token : mainnetCurrency as Token, [token, mainnetCurrency]),
        parseFloat(tokenBalance?.toFixed(2) as string),
        React.useMemo(() => pairs?.[0] ? pairs?.[0] : { token0: { id: address }, token1: { id: pair } }, [pairs, pair, address]),
        React.useMemo(() => transactionData?.data?.swaps?.map((swap: any) => ({
            ...swap,
            timestamp: swap.transaction.timestamp,
        })), [transactionData.data])
    );

    const pairCurrency = useCurrency(pair ?? undefined);

    const title = React.useMemo(function () {
        let price = tokenData?.priceUSD
        if (!price) {
            if (screenerToken && screenerToken.priceUsd) {
                price = screenerToken?.priceUsd
            } else if (screenerPair && screenerPair.priceUsd) {
                price = screenerPair.priceUsd
            }
        }

        if (price) {
            price = parseFloat(price).toFixed(6)
        }
        if (screenerToken && screenerToken.baseToken && screenerToken.quoteToken) {
            return `Kiba Charts | ${screenerToken?.baseToken?.symbol}/${screenerToken?.quoteToken?.symbol} Chart ${price ? `| $${price}` : ''}`;
        }
        if (screenerPair && screenerPair.baseToken && screenerPair.quoteToken) {
            return `Kiba Charts | ${screenerPair?.baseToken?.symbol}/${screenerPair?.quoteToken?.symbol} Chart ${price ? `| $${price}` : ''}`;
        }

        if (mainnetCurrency && pairCurrency) {
            return `Kiba Charts | ${mainnetCurrency?.symbol}/${pairCurrency?.symbol} Chart ${price ? `| $${price}` : ''}`
        }

        return `Kiba Charts | View ETH and BSC Token Charts, Transactions, Holders, etc`;
    }, [tokenData?.priceUSD, screenerPair?.priceUsd, screenerToken?.priceUsd, mainnetCurrency, pairCurrency, token])

    React.useEffect(() => {
        ReactGA.pageview(window.location.pathname, undefined, document.title)
    }, [])

    useSetTitle(title)

    const pageMeta = React.useMemo(function () {
        const data = screenerToken ? screenerToken : screenerPair
        return {
            title,
            description: `Swap ${data?.baseToken?.symbol}/${data?.quoteToken?.symbol} and view ${data?.baseToken?.symbol}/${data?.quoteToken?.symbol} Chart and Transaction Data on KibaCharts`,
            canonical: window.location.href,
            meta: {
                charset: 'utf-8',

                name: {
                    keywords: 'swap,charts,react,meta,document,html,tags,kiba,kibaswap,kibacharts,erc20,bep20,tokens'
                }
            }
        }
    }, [screenerToken, title, screenerPair])

    const holdings = {
        token,
        tokenBalance: tokenBalance || 0,
        tokenValue: 0,
        formattedUsdString: usdcAndEthFormatted?.value,
        refetchUsdValue: usdcAndEthFormatted?.refetch,
        pair,
    };

    const formatPriceLabel = (key: string) => {
        switch (key) {
            case "h24":
                return "Price 24hr";
            case "h6":
                return "Price 6hr";
            case "h1":
                return "Price 1hr";
            case "m5":
                return "Price 5min";
            default:
                return key;
        }
    };

    const shareClick = () => {
        const actionLabel = `${token?.symbol ?? screenerPair?.baseToken?.symbol}/${pairCurrency?.symbol ?? screenerPair?.quoteToken?.symbol}`

        if (navigator && navigator.share) {
            navigator.share({
                title: `KibaCharts - ${token?.symbol} / ${pairCurrency?.symbol}`,
                url: window.location.href
            }).then(() => {
                console.log(`[navigator.share]`, 'Thanks for sharing!');
            })
                .catch(console.error);

            ReactGA.event({
                category: "Share_Charts",
                action: `Share Charts via web share API`,
                label: actionLabel,
            });
        } else {
            copy(window.location.href)

            ReactGA.event({
                category: "Share_Charts",
                action: `Share Charts via clipboard copy`,
                label: actionLabel,
            });

            Swal.fire({
                toast: true,
                position: isMobile ? 'top-start' : 'bottom-end',
                timer: 5000,
                showConfirmButton: false,
                timerProgressBar: true,
                icon: 'success',
                title: `Successfully copied link to clipboard`
            })
        }
    }
    // search for another token to view its chart, this will control state for showing search modal 
    const [showSearch, setShowSearch] = React.useState(false);
    const toggleShowSearchOn = () => setShowSearch(true);
    const toggleShowSearchOff = () => setShowSearch(false);

    // they can also change the current chart by selecting a token from the token dropdown.
    const onCurrencySelect = React.useCallback((currency: any) => {
        if (!currency) return;
        ref.current = currency;
        setSelectedCurrency({ type: "update", payload: currency });
        const currencyAddress = currency?.address || currency?.wrapped?.address;
        history.push(
            `/selective-charts/${toChecksum(currencyAddress)}/${currency?.symbol}/${currency.name}/${currency.decimals}`
        );
        setAddress(currencyAddress);
    }, [])

    const prices = useBnbPrices()
    /* Memoized function to render the Double Currency Logo for the current chart */
    const LogoMemo = React.useMemo(() => {
        return Boolean(!!hasSelectedData) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-between' }}>
                {network == 'ethereum' && ethPrice &&
                    <TYPE.small fontSize={12}>
                        <Badge>ETH ${parseFloat(parseFloat(ethPrice.toString()).toFixed(2)).toLocaleString()}</Badge>
                    </TYPE.small>
                }
                {network === 'bsc' && prices && prices.current &&
                    <TYPE.small fontSize={12}>
                        <Badge>BNB ${parseFloat(parseFloat(prices?.current.toString()).toFixed(2)).toLocaleString()}</Badge>
                    </TYPE.small>
                }
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        paddingRight: isMobile ? 0 : 15,
                        borderRight: `${!isMobile ? "1px solid #444" : "none"}`,
                    }}
                >
                    Viewing
                    {network === 'ethereum' && (
                        <DoubleCurrencyLogo
                            style={{
                                marginRight: 3,
                            }}
                            size={30}
                            margin
                            currency0={pairCurrency as any}
                            currency1={mainnetCurrency ? mainnetCurrency : fallbackFromPair}
                        />
                    )}
                    {network === 'bsc' &&
                        <Badge style={{ marginLeft: 3, marginRight: 3 }}>
                            <TYPE.italic>{screenerPair?.baseToken?.symbol}/{screenerPair?.quoteToken?.symbol}</TYPE.italic>
                        </Badge>
                    }
                    on KibaCharts
                </span>
            </div>
        ) : null;
    }, [mainnetCurrency, fallbackFromPair, screenerPair?.baseToken, prices?.current, network, ethPrice, pairCurrency, hasSelectedData]);
    /* memoized function to render the currency input select that represents the current viewed chart's token */
    const PanelMemo = React.useMemo(() => {
        return embedModel.embedMode ? null : !Boolean(chainId) || Boolean(chainId) ? (
            <>
                <div
                    style={{
                        paddingTop: hasSelectedData ? "" : 20,
                        width: "100%",
                        gap: 20,
                        display: "flex",
                        flexFlow: isMobile ? "column wrap" : "row nowrap",
                        alignItems: "center",
                    }}
                >
                    {!hasSelectedData ? (
                        <>
                            <ButtonSecondary onClick={toggleShowSearchOn}>
                                <TYPE.black style={{ cursor: "pointer" }}>
                                    Search for a token to view <ArrowUpRight />
                                </TYPE.black>
                            </ButtonSecondary>
                        </>
                    ) : null}
                    <CurrencyInputPanel
                        label={"gains"}
                        showMaxButton={false}
                        value={``}
                        showCurrencyAmount={false}
                        hideBalance={true}
                        hideInput={true}
                        currency={!hasSelectedData ? undefined : mainnetCurrency}
                        onUserInput={_.noop}
                        onMax={undefined}
                        fiatValue={undefined}
                        onCurrencySelect={onCurrencySelect}
                        otherCurrency={undefined}
                        showCommonBases={false}
                        id="chart-currency-input"
                    />
                </div>
            </>
        ) : null;
    }, [mainnetCurrency, embedModel.embedMode, hasSelectedData, isMobile, chainId]);
    const priceChange = React.useMemo(() => {
        if (!screenerToken && !screenerPair) return {}
        if (screenerPair?.priceChange) return screenerPair?.priceChange
        if (screenerToken && screenerToken.priceChange) return screenerToken.priceChange
        return {}
    }, [screenerToken, screenerPair])
    const getRetVal = React.useMemo(
        function () {
            let retVal = "", pairSymbol = "";

            const { selectedCurrency: currency } = selectedCurrency;
            if (chainId === 1 || !chainId) {
                retVal = "UNISWAP:";
                if (pairs && pairs.length) {
                    pairSymbol = `${pairs?.[0]?.token0?.symbol?.toLowerCase() ===
                        currency?.symbol?.toLowerCase()
                        ? pairs?.[0]?.token1?.symbol
                        : pairs?.[0]?.token0?.symbol
                        }`;
                    if (pairSymbol === "DAI")
                        return `DOLLAR${currency?.symbol?.replace("$", "")}DAI`;
                    retVal += `${currency?.symbol}${pairs?.[0]?.token0?.symbol === currency?.symbol
                        ? pairs?.[0]?.token1?.symbol
                        : pairs?.[0]?.token0?.symbol
                        }`;
                } else {
                    if (
                        screenerPair?.baseToken?.address &&
                        screenerPair?.baseToken?.symbol &&
                        screenerPair?.baseToken?.symbol !== "WETH"
                    )
                        retVal = `${retVal}${screenerPair?.baseToken?.symbol}WETH`;
                    else if (currency && currency.symbol && currency.symbol !== "WETH")
                        retVal = `UNISWAP:${currency.symbol}WETH`;
                    else if (currency && currency.symbol && currency.symbol === "WETH")
                        retVal = chainId == 1 ? "UNISWAP:WETHUSDT" : chainId == 56 ? "WETHWBNB" : `UNISWAP:WETHUSDT`;

                    if (
                        (retVal == "UNISWAP:" && screenerPair?.baseToken?.symbol) ||
                        mainnetCurrency?.symbol
                    ) {
                        retVal = `UNISWAP:${screenerPair?.baseToken?.symbol ? screenerPair?.baseToken?.symbol : mainnetCurrency?.symbol
                            }WETH`;
                    }
                }
            } else if (chainId && chainId === 56) {
                if (screenerPair?.baseToken?.symbol == "BNB" || screenerPair?.baseToken?.symbol == "WBNB") {
                    return "WBNBBUSD"
                }
                retVal = "PANCAKESWAP:" + pairSymbol + screenerPair?.baseToken?.symbol;
            }
            return retVal;
        },
        [
            screenerPair?.baseToken?.symbol,
            pairs,
            selectedCurrency.selectedCurrency,
            selectedCurrency,
            mainnetCurrency,
        ]
    );
    const deps = [
        selectedCurrency,
        pairs,
        getRetVal,
        screenerPair?.baseToken?.symbol,
        chainId,
    ];
    const tokenSymbolForChart = React.useMemo(() => getRetVal, deps);
    const [collapsed, setCollapsed] = React.useState(false);
    const gridTemplateColumns = React.useMemo(
        function () {
            if (!hasSelectedData || !selectedCurrency || !params.pairAddress) return `100%`;
            if (embedModel.embedMode && !embedModel.showChartInfo) return '100%';
            return isMobile ? "100%" : collapsed ? "5.5% 95.5%" : "25% 75%";
        },
        [selectedCurrency, embedModel, hasSelectedData, isMobile, collapsed]
    );

    const pairAddress = React.useMemo(() => {
        if (params?.pairAddress) return params?.pairAddress;
        return screenerToken?.pairAddress ? screenerToken?.pairAddress : pairs?.[0]?.id
    }, [screenerToken, pairs, params.pairAddress])

    const [showEmbedChartModal, setShowEmbedChartModal] = React.useState(false)

    const dismissEmbedModal = () => setShowEmbedChartModal(false)
    const embedClick = () => {
        setShowEmbedChartModal(true)
    }

    const sidebarPaddingTop = embedModel.embedMode && embedModel.showTrending ? '1.35rem' : ''
    const darkMode = useIsDarkMode()

    return (
        <React.Suspense fallback={<BarChartLoaderSVG />}>
            <PageMeta metadata={pageMeta} />
            <ChartSearchModal isOpen={showSearch} onDismiss={toggleShowSearchOff} />
            <SelectiveChartEmbedModal title={`${token?.symbol}/${pairCurrency?.symbol} Chart`} chartLink={window.location.href} isOpen={showEmbedChartModal} onDismiss={dismissEmbedModal} />
            <WrapperCard
                embedModel={embedModel}
                darkMode={darkMode || embedModel.embedMode && embedModel.theme == 'dark'}
                isMobile={isMobile}
                gridTemplateColumns={gridTemplateColumns}
            >
                {hasSelectedData && (embedModel.embedMode == false || embedModel.showChartInfo) && (<div style={{ paddingTop: sidebarPaddingTop }}>
                    <ChartSidebar
                        buySellTax={buySellTax}
                        tokenCurrency={mainnetCurrency}
                        holdings={holdings}
                        loading={loadingNewData}
                        collapsed={collapsed}
                        tokenInfo={tokenInfo}
                        onCollapse={setCollapsed}
                        token={{
                            name:
                                screenerPair?.baseToken?.name ??
                                (((mainnetCurrency as Currency)
                                    ? (mainnetCurrency as Currency)
                                    : (ref.current as Currency)
                                )?.name as string),
                            symbol:
                                screenerPair?.baseToken?.symbol ??
                                (((mainnetCurrency as Currency)
                                    ? (mainnetCurrency as Currency)
                                    : (ref.current as Currency)
                                )?.symbol as string),
                            decimals:
                                mainnetCurrency?.decimals?.toString() ??
                                ((mainnetCurrency as Currency)
                                    ? (mainnetCurrency as Currency)
                                    : (ref.current as Currency)
                                )?.decimals?.toString(),
                            address:
                                screenerPair?.baseToken?.address ??
                                ((mainnetCurrency as Currency)
                                    ? (mainnetCurrency as Currency)
                                    : (ref.current as Currency)
                                )?.wrapped?.address,
                        }}
                        tokenData={tokenData}
                        screenerToken={screenerToken ? screenerToken : screenerPair}
                        chainId={screenerPairChainId}
                    />
                </div>
                )}
                <div
                    style={{
                        marginLeft: (embedModel.embedMode && !embedModel.showChartInfo) || isMobile ? 0 : 10,
                        borderLeft: ((embedModel.embedMode && !embedModel.showChartInfo) || isMobile || !hasSelectedData)
                            ? "none"
                            : Boolean(
                                params?.pairAddress &&
                                (selectedCurrency || !!mainnetCurrency?.symbol)
                            )
                                ? "1px solid #444"
                                : "none",
                        overflow: 'scroll',
                        maxWidth: `100%`
                    }}
                >
                    <ChartWrapper>
                        <StyledDiv
                            isMobile={isMobile}
                            style={{
                                justifyContent: !hasSelectedData
                                    ? ""
                                    : !isMobile
                                        ? "space-between"
                                        : "",
                                marginBottom: 5,
                            }}
                        >
                            <span
                                style={{
                                    paddingRight: isMobile ? 0 : 15,
                                    borderRight: `${!isMobile ? "1px solid #444" : "none"}`,
                                }}
                            >
                                {!loadingNewData && (
                                    <>
                                        <ButtonOutlined padding={`3px`} style={{ padding: '3px !important', marginRight: 16 }} size={'sm'} onClick={shareClick}>
                                            Share
                                        </ButtonOutlined>
                                    </>
                                )}
                            </span>

                            {LogoMemo}

                            {!hasSelectedData ? (
                                <Badge>Select a token to get started</Badge>
                            ) : isMobile ? null : (
                                <span style={{ margin: 0 }}>
                                    <TokenSocials
                                        theme={theme}
                                        tokenSymbol={screenerPair?.baseToken?.symbol || ''}
                                        tokenInfo={tokenInfo} />
                                </span>
                            )}

                            {loadingNewData &&
                                <LoadingSkeleton count={1} />}

                            {!hasSelectedData || loadingNewData || isMobile
                                ? null
                                : Boolean(
                                    priceChange
                                ) && (
                                    <div style={{ paddingLeft: 0 }}>
                                        <div
                                            style={{
                                                paddingLeft: 0,
                                                justifyContent: "space-between",
                                                display: "flex",
                                                flexFlow: isMobile ? "row" : "row wrap",
                                                alignItems: "center",
                                                gap: 15,
                                            }}
                                        >
                                            {Object.keys(priceChange).map((key) => (
                                                <div
                                                    key={key}
                                                    style={{
                                                        paddingRight:
                                                            _.last(
                                                                Object.keys(priceChange)
                                                            ) == key
                                                                ? 0
                                                                : 10,
                                                        borderRight:
                                                            _.last(
                                                                Object.keys(priceChange)
                                                            ) == key
                                                                ? "none"
                                                                : "1px solid #444",
                                                    }}
                                                >
                                                    <TYPE.small textAlign="center">
                                                        {formatPriceLabel(key)}
                                                    </TYPE.small>
                                                    <TYPE.black>
                                                        {(priceChange as any)?.[key] < 0 ? (
                                                            <TrendingDown style={{ marginRight: 2, color: "red" }} />
                                                        ) : (
                                                            <TrendingUp style={{ marginRight: 2, color: "green" }} />
                                                        )}
                                                        {(priceChange as any)?.[key]}%
                                                    </TYPE.black>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {PanelMemo}

                            {Boolean(!hasSelectedData && userChartHistory.length) && (
                                <RecentlyViewedCharts />
                            )}
                        </StyledDiv>

                        {loadingNewData ? (
                            <LoadingSkeleton count={9} borderRadius={40} />
                        ) :
                            (
                                <React.Fragment>
                                    {isMobile == false && hasSelectedData && (
                                        <React.Fragment>
                                            <TokenStats
                                                tokenData={screenerToken}
                                            />
                                            <TopTokenHolders
                                                address={address ?? screenerPair?.baseToken?.address}
                                                chainId={screenerPairChainId}
                                            />
                                        </React.Fragment>
                                    )}
                                    <div
                                        style={{ marginTop: "0.25rem", marginBottom: "0.25rem" }}
                                    />
                                    {Boolean(
                                        hasSelectedData &&
                                        params?.pairAddress && network
                                    ) ? (
                                        <>
                                            <ChartComponent
                                                networkProvided={network}
                                                pairAddress={pairAddress}
                                                pairData={pairs}
                                                symbol={
                                                    screenerPair?.baseToken?.symbol ||
                                                    selectedCurrency?.selectedCurrency?.symbol ||
                                                    ("" as string)
                                                }
                                                address={address as string}
                                                tokenSymbolForChart={tokenSymbolForChart}
                                            />
                                            <TableQuery
                                                transactionData={params?.network == 'bsc' ? bscTransactionData : transactionData}
                                                tokenSymbol={
                                                    (screenerPair?.baseToken?.symbol ? screenerPair?.baseToken?.symbol : token?.symbol) as string
                                                }
                                                address={address as string}
                                                pairs={pairAddress ? [{ id: pairAddress }, ...pairs] : pairs}
                                            />

                                        </>
                                    ) : null}
                                </React.Fragment>

                            )}
                        {hasSelectedData &&
                            embedModel.embedMode == false &&
                            isMobile == false && (
                                <TYPE.link style={{
                                    fontSize: 12,
                                    alignItems: 'center',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    cursor: 'pointer'
                                }} onClick={embedClick}>
                                    <Code style={{ fontSize: 12 }} /> &nbsp; Embed this chart
                                </TYPE.link>
                            )}
                    </ChartWrapper>
                </div>
            </WrapperCard>
        </React.Suspense>
    );
};
