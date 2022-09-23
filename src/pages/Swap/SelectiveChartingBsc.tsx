/*tslint-disable*/
import "./transitions.css";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  TrendingDown,
  TrendingUp,
} from "react-feather";
import { Currency, Token } from "@uniswap/sdk-core";
import { DarkCard, LightCard } from "components/Card";
import React, {useEffect, useState} from "react";
import { StyledInternalLink, TYPE } from "theme";
import { darken, lighten } from "polished";
import styled, { useTheme } from "styled-components/macro";
import {
  toChecksum,
  useEthPrice,
  useTokenData,
  useTokenTransactions,
} from "state/logs/utils";
import { useBnbPrices, useBscPairs, useBscTokenData, useBscTokenTransactions } from "state/logs/bscUtils";
import { useBscToken, useCurrency, useToken } from "hooks/Tokens";
import { useDexscreenerToken, useTokenInfo } from "components/swap/ChartPage";
import { useLocation, useParams } from "react-router";

import BarChartLoaderSVG from "components/swap/BarChartLoader";
import { ButtonSecondary } from "components/Button"
import { CardSection } from "components/earn/styled";
import { ChartComponent } from "./ChartComponent";
import { ChartSearchModal } from "pages/Charts/ChartSearchModal";
import { ChartSidebar } from "components/ChartSidebar";
import { LoadingSkeleton } from "pages/Pool/styleds";
import ReactGA from "react-ga";
import { RecentlyViewedCharts } from "./RecentViewedCharts";
import { TableQuery } from "./TableQuery";
import TokenSocials from "./TokenSocials";
import { TokenStats } from "./TokenStats";
import { TopTokenHolders } from "components/TopTokenHolders/TopTokenHolders";
import _ from "lodash";
import { isAddress } from "utils";
import { useConvertTokenAmountToUsdString } from "pages/Vote/VotePage";
import { useHistory } from "react-router-dom";
import { useTokenBalance } from "state/wallet/hooks";
import { useUserChartHistoryManager } from "state/user/hooks";
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

const CurrencyInputPanel = React.lazy(() =>  import("components/CurrencyInputPanel"));
const CurrencyLogo = React.lazy(() => import( "components/CurrencyLogo"));

const Badge = React.lazy(() => import("components/Badge"));

const DoubleCurrencyLogo = React.lazy(() => import("components/DoubleLogo"));

export function useLocationEffect(callback: (location?: any) => any) {
  const location = useLocation();

  React.useEffect(() => {
    callback(location);
  }, [location, callback]);
}
const StyledDiv = styled.div<{isMobile?:boolean}>`
  font-family: "Open Sans";
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: ${props => props.isMobile ? "stretch" : "center"};
  padding: 3px 8px;
  flex-flow: ${(props) => (props.isMobile ? "column wrap" : "row wrap")};
`;

const BackLink = styled(StyledDiv)`
  &:hover {
    color: ${props => lighten(0.2, props.theme.text1)};
  }
`;

const WrapperCard = styled(DarkCard) <{ gridTemplateColumns: string, isMobile: boolean }>`
  background: ${props => props.theme.chartTableBg};
  max-width: 100%;
  display: grid;
  color ${props => props.theme.text1};
  grid-template-columns: ${props => props.gridTemplateColumns};
  border-radius: 30px;
  padding:${(props) => props.isMobile ? '.1rem' : '1rem'}
`

type BscChartProps = {
    params: any
}

export const SelectiveChartBsc = () => {
  const ref = React.useRef<any>();
  const { account, chainId } = useWeb3React();
  const history = useHistory();
  const params = useParams<{
    tokenAddress?: string;
    tokenSymbol?: string;
    name?: string;
    decimals?: string;
  }>();
  const isMobile = useIsMobile()
  const mainnetCurrency = useCurrency(
    !chainId || chainId === 1 ? params?.tokenAddress : undefined
  );
  const prebuilt = React.useMemo(
    () =>
    ({
      address: params?.tokenAddress,
      chainId,
      name: params?.name,
      symbol: params?.tokenSymbol,
      isNative: false,
      isToken: true,
    } as Currency),
    [params]
  );
  const prebuiltCurrency = React.useMemo(
    () => (!chainId || chainId === 1 ? mainnetCurrency : prebuilt),
    [mainnetCurrency, chainId, prebuilt]
  );
  const tokenAddressSupplied = React.useMemo(
    () =>
      ref?.current?.address &&
        isAddress(ref?.current?.address) &&
        ref.current?.address != params?.tokenAddress
        ? toChecksum(ref.current?.address)
        : toChecksum(params?.tokenAddress),
    [params?.tokenAddress, ref.current]
  );
  const [address, setAddress] = React.useState(
    tokenAddressSupplied ? tokenAddressSupplied : ""
  );
  const { data: bscData, loading: bscLoading } = useBscTokenTransactions(address?.toLowerCase(), 'bsc', 5000)
  const prices = useBnbPrices() 
  const tokenInfo = useTokenInfo(chainId ?? 1, address);
  const tokenData = useBscTokenData(address?.toLowerCase(), prices?.current, prices?.oneDay);
  const pairs = useBscPairs(address)
  const token = useBscToken(address);
  const tokenBalance = useTokenBalance(account ?? undefined, token as any);
  const screenerToken = useDexscreenerToken(address);
  const transactionData = useTokenTransactions(address, pairs, 20000);
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
  const hasSelectedData = Boolean(params?.tokenAddress && selectedCurrency?.selectedCurrency?.name);
  const theme = useTheme()
  const [loadingNewData, setLoadingNewData] = React.useState(false);

  const locationCallback = React.useCallback((location: any) => {
    console.log(`location listener`, location);
    const newAddress = location.pathname.split("/")[2]?.toLowerCase();
    const newSymbol = location.pathname.split("/")[3];
    const newName = location.pathname.split("/")[4];
    const newDecimals = location.pathname.split("/")[5];
    if (newAddress && newSymbol) {
      setLoadingNewData(true);
      const checksummed = toChecksum(newAddress);
      setAddress(checksummed);
      const newToken = new Token(
        chainId ?? 1,
        newAddress,
        parseInt(newDecimals) ?? 18,
        newSymbol,
        newName ?? ""
      );
      if (ref.current) {
        ref.current = newToken;
      } else {
        ref.current = {
          ...mainnetCurrency,
          address: checksummed,
          symbol: newSymbol,
        };
        if (newName) {
          ref.current.name = newName;
        }
        if (newDecimals) {
          ref.current.decimals = +newDecimals;
        }
      }
      
      setSelectedCurrency({ type: "update", payload: ref.current });
      updateUserChartHistory([
        {
          time: new Date().getTime(),
          data: [],
          token: { ...ref.current, wrapped: undefined },
          summary: `Viewing ${ref.current.name} token chart`,
          chainId
        },
      ]);

      // send event to analytics
      ReactGA.event({
        category: "Charts",
        action: `View`,
        label: `${ref.current.name}:${ref.current.symbol}`,
      });
      // reset ze load
      setLoadingNewData(false);
    } else {
      setSelectedCurrency({ payload: undefined, type: "update" });
      ref.current = undefined;
    }
    
  }, []);

  useLocationEffect(locationCallback);

  const [userChartHistory, updateUserChartHistory] =
    useUserChartHistoryManager();

  React.useEffect(() => {
    if (Object.keys(params).every((key) => !Boolean((params as any)[key]))) {
      setSelectedCurrency({ payload: undefined, type: "update" });
      ref.current = undefined;
    } else if (
      params.tokenAddress &&
      params.name &&
      params.tokenSymbol &&
      params.decimals
    ) {
      updateUserChartHistory([
        {
          time: new Date().getTime(),
          data: [],
          token: { ...prebuilt, wrapped: undefined },
          summary: `Viewing ${prebuilt.name} token chart`,
          chainId
        },
      ]);
    }
  }, []);

  const usdcAndEthFormatted = useConvertTokenAmountToUsdString(
    token as Token,
    parseFloat(tokenBalance?.toFixed(2) as string),
    pairs?.[0],
    transactionData?.data?.swaps?.map((swap: any) => ({
      ...swap,
      timestamp: swap.transaction.timestamp,
    }))
  );

  const pair = React.useMemo(
    function () {
      if (!Boolean(Array.isArray(pairs) && pairs.length)) return undefined;

      return `${pairs?.[0]?.token0?.symbol?.toLowerCase() ===
          token?.symbol?.toLowerCase()
          ? pairs?.[0]?.token1?.id
          : pairs?.[0]?.token0?.id
        }`;
    },
    [tokenData, pairs, token]
  );

  const pairCurrency = useCurrency(pair ?? undefined);

  const holdings = {
    token,
    tokenBalance: tokenBalance || 0,
    tokenValue: 0,
    formattedUsdString: usdcAndEthFormatted?.value,
    refetchUsdValue: usdcAndEthFormatted?.refetch,
    pair,
  };

  const backClick = React.useCallback(() => {
    console.log("~history", history)
    ref.current = {
      equals: () => false,
      address: undefined,
      decimals: undefined,
      symbol: undefined,
      name: undefined,
      isToken: false,
      isNative: false,
    };
    setSelectedCurrency({ type: "update", payload: ref.current });
    history.goBack();
  }, [ref.current]);

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

  /* Memoized function to render the Double Currency Logo for the current chart */
  const LogoMemo = React.useMemo(() => {
    return Boolean(!!hasSelectedData) ? (
      <div style={{display:'flex', alignItems:'center', gap: 20, justifyContent:'space-between'}}>
      {Boolean(!chainId || chainId == 56) && prices && prices?.current && <TYPE.small fontSize={12}>BNB <Badge>${parseFloat(parseFloat(prices.current.toString()).toFixed(2)).toLocaleString()}</Badge> </TYPE.small>}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          paddingRight: isMobile ? 0 : 15,
          borderRight: `${!isMobile ? "1px solid #444" : "none"}`,
        }}
      >
        Viewing
        <DoubleCurrencyLogo
          style={{
            marginRight: 3,
          }}
          size={30}
          margin
          currency0={mainnetCurrency as any}
          currency1={pairCurrency as any}
        />
        on KibaCharts
      </span>
      </div>
    ) : null;
  }, [mainnetCurrency, chainId, prices, pairCurrency, hasSelectedData]);
  /* memoized function to render the currency input select that represents the current viewed chart's token */
  const PanelMemo = React.useMemo(() => {
    return !Boolean(chainId) || Boolean(chainId) ? (
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
         
        </div>
      </>
    ) : Boolean(chainId) ? (
      <TYPE.small>
        {chainId && chainId == 56 ? "BSC" : `${chainId}`} support coming soon
      </TYPE.small>
    ) : null;
  }, [mainnetCurrency, hasSelectedData, isMobile, chainId]);

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
            params.tokenAddress &&
            params.tokenSymbol &&
            params.tokenSymbol !== "WETH"
          )
            retVal = `${retVal}${params.tokenSymbol}WETH`;
          else if (currency && currency.symbol && currency.symbol !== "WETH")
            retVal = `UNISWAP:${currency.symbol}WETH`;
          else if (currency && currency.symbol && currency.symbol === "WETH")
            retVal = chainId == 1 ? "UNISWAP:WETHUSDT" : chainId == 56 ? "WETHWBNB" : `UNISWAP:WETHUSDT`;

          if (
            (retVal == "UNISWAP:" && params?.tokenSymbol) ||
            prebuilt?.symbol
          ) {
            retVal = `UNISWAP:${params?.tokenSymbol ? params?.tokenSymbol : prebuilt?.symbol
              }WETH`;
          }
        }
      } else if (chainId && chainId === 56) {
        if (params?.tokenSymbol == "BNB" || params?.tokenSymbol == "WBNB") {
          return "WBNBBUSD"
        }
        retVal = "PANCAKESWAP:" + pairSymbol + params?.tokenSymbol;
      }
      return retVal;
    },
    [
      params?.tokenSymbol,
      pairs,
      selectedCurrency.selectedCurrency,
      params?.tokenAddress,
      selectedCurrency,
      prebuilt,
    ]
  );
  const deps = [
    selectedCurrency,
    pairs,
    getRetVal,
    params?.tokenSymbol,
    prebuilt?.symbol,
    chainId,
  ];
  const tokenSymbolForChart = React.useMemo(() => getRetVal, deps);
  const [collapsed, setCollapsed] = React.useState(false);
  const gridTemplateColumns = React.useMemo(
    function () {
      if (!hasSelectedData || !selectedCurrency || !params?.tokenAddress) return `100%`;
      return isMobile ? "100%" : collapsed ? "5.5% 95.5%" : "25% 75%";
    },
    [selectedCurrency, hasSelectedData, isMobile, params.tokenAddress, collapsed]
  );


  const priceChange = React.useMemo(() => {
    
    if (!screenerToken) return {} as any
    if (screenerToken && screenerToken.priceChange) return screenerToken.priceChange
    return {} as any
  }, [screenerToken])
  return (
    <React.Suspense fallback={<BarChartLoaderSVG />}>
      <ChartSearchModal isOpen={showSearch} onDismiss={toggleShowSearchOff} />
      <WrapperCard
        isMobile={isMobile}
        gridTemplateColumns={gridTemplateColumns}
      >
        {hasSelectedData && (
          <div>
            <ChartSidebar
              tokenCurrency={mainnetCurrency}
              holdings={holdings}
              loading={loadingNewData}
              collapsed={collapsed}
              tokenInfo={tokenInfo}
              onCollapse={setCollapsed}
              token={{
                name:
                  params?.name ??
                  (((selectedCurrency.selectedCurrency as Currency)
                    ? (selectedCurrency.selectedCurrency as Currency)
                    : (ref.current as Currency)
                  )?.name as string),
                symbol:
                  params?.tokenSymbol ??
                  (((selectedCurrency.selectedCurrency as Currency)
                    ? (selectedCurrency.selectedCurrency as Currency)
                    : (ref.current as Currency)
                  )?.symbol as string),
                decimals:
                  params?.decimals ??
                  ((selectedCurrency.selectedCurrency as Currency)
                    ? (selectedCurrency.selectedCurrency as Currency)
                    : (ref.current as Currency)
                  )?.decimals?.toString(),
                address:
                  params?.tokenAddress ??
                  ((selectedCurrency.selectedCurrency as Currency)
                    ? (selectedCurrency.selectedCurrency as Currency)
                    : (ref.current as Currency)
                  )?.wrapped?.address,
              }}
              tokenData={tokenData}
              screenerToken={screenerToken}
              chainId={chainId}
            />
          </div>
        )}
        <div
          style={{
            marginLeft: isMobile ? 0 : 10,
            borderLeft: isMobile
              ? "none"
              : Boolean(
                params?.tokenAddress &&
                (selectedCurrency || !!prebuilt?.symbol)
              )
                ? "1px solid #444"
                : "none",
          }}
        >
          <CardSection style={{ padding: isMobile ? 0 : "" }}>
            <StyledDiv
              isMobile={isMobile}
              style={{
                justifyContent: !hasSelectedData
                  ? ""
                  : !isMobile
                    ? "space-between"
                    : "",
                paddingBottom: 2,
                marginTop: 10,
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
                    <BackLink style={{ cursor: "pointer" }} onClick={backClick}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ChevronLeft /> Go Back
                      </span>
                    </BackLink>
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
                    tokenSymbol={params?.tokenSymbol || ''}
                    tokenInfo={tokenInfo} />
                </span>
              )}

              {loadingNewData &&
                <LoadingSkeleton count={1} />}

              {!hasSelectedData || loadingNewData || isMobile
                ? null
                : Boolean(
                  screenerToken &&
                  (screenerToken?.priceChange || screenerToken.volume)
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
                            {priceChange?.[key] < 0 ? (
                              <TrendingDown style={{ marginRight:2, color: "red" }} />
                            ) : (
                              <TrendingUp style={{marginRight:2, color: "green" }} />
                            )}
                            {priceChange?.[key]}%
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
              <LoadingSkeleton count={9} borderRadius={40 } />
            ) : 
            (
              <React.Fragment>
                {isMobile == false && hasSelectedData && (
                  <React.Fragment>
                    <TokenStats tokenData={screenerToken} />
                    <TopTokenHolders
                      address={address ?? params?.tokenAddress}
                      chainId={chainId}
                    />
                  </React.Fragment>
                )}
                <div
                  style={{ marginTop: "0.25rem", marginBottom: "0.25rem" }}
                />
                {Boolean(
                  hasSelectedData && 
                  params?.tokenAddress &&
                  (selectedCurrency?.selectedCurrency?.symbol ||
                    !!prebuilt?.symbol)
                ) ? (
                  <>
                    <ChartComponent
                      pairAddress={screenerToken?.pairAddress as string}
                      pairData={pairs}
                      symbol={
                        params?.tokenSymbol ||
                        selectedCurrency?.selectedCurrency?.symbol ||
                        ("" as string)
                      }
                      address={address as string}
                      tokenSymbolForChart={tokenSymbolForChart}
                    />
                    <TableQuery 
                      transactionData={{data: bscData, loading: bscLoading}}
                      tokenSymbol={
                          (params?.tokenSymbol ? params?.tokenSymbol : token?.symbol) as string
                      }
                      address={address as string}
                      pairs={pairs} />
                
                  </>
                ) : null}
              </React.Fragment>
            )}
          </CardSection>
        </div>
      </WrapperCard>
    </React.Suspense>
  );
};
