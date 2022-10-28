/*tslint-disable*/
import "./transitions.css";

import {
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from "react-feather";
import { ButtonOutlined, ButtonSecondary } from "components/Button"
import { Currency, Token } from "@uniswap/sdk-core";
import { DarkCard, LightCard } from "components/Card";
import React, { useEffect, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { StyledInternalLink, TYPE } from "theme";
import { darken, lighten } from "polished";
import styled, { useTheme } from "styled-components/macro";
import {
  toChecksum,
  useEthPrice,
  usePairs,
  useTokenData,
  useTokenTransactions,
} from "state/logs/utils";
import { useCurrency, useToken } from "hooks/Tokens";
import { useDexscreenerToken, useTokenInfo } from "components/swap/ChartPage";
import { useLocation, useParams } from "react-router";

import BarChartLoaderSVG from "components/swap/BarChartLoader";
import { ChartWrapper } from "components/earn/styled";
import { ChartComponent } from "./ChartComponent";
import { ChartSearchModal } from "pages/Charts/ChartSearchModal";
import { ChartSidebar } from "components/ChartSidebar";
import { LoadingSkeleton } from "pages/Pool/styleds";
import ReactGA from "react-ga";
import { RecentlyViewedCharts } from "./RecentViewedCharts";
import Swal from 'sweetalert2'
import { TableQuery } from "./TableQuery";
import TokenSocials from "./TokenSocials";
import { TokenStats } from "./TokenStats";
import { TopTokenHolders } from "components/TopTokenHolders/TopTokenHolders";
import _ from "lodash";
import { isAddress } from "utils";
import { useConvertTokenAmountToUsdString } from "pages/Vote/VotePage";
import useCopyClipboard from 'hooks/useCopyClipboard'
import useLast from "hooks/useLast";
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
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: ${props => props.isMobile ? "stretch" : "center"};
  padding: 3px 8px;
  flex-flow: ${(props) => (props.isMobile ? "column wrap" : "row wrap")};
`;

const WrapperCard = styled(DarkCard) <{ gridTemplateColumns: string, isMobile: boolean }>`
  background: ${props => props.theme.chartTableBg};
  max-width: 100%;
  display: grid;
  color ${props => props.theme.text1};
  grid-template-columns: ${props => props.gridTemplateColumns};
  border-radius: 30px;
  padding:${(props) => props.isMobile ? '.01rem 5px' : '1rem'}
`

export const SelectiveChart = () => {
  const ref = React.useRef<any>();
  const { account, chainId } = useWeb3React();
  const history = useHistory();
  const lastChainId = useLast(chainId)
  const params = useParams<{
    tokenAddress?: string;
    tokenSymbol?: string;
    name?: string;
    decimals?: string;
    pairAddress?: string;
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
  const tokenInfo = useTokenInfo(chainId ?? 1, address);
  const tokenData = useTokenData(address?.toLowerCase(), 10000);
  const { pairs } = tokenData;
  const token = useToken(address);
  const tokenBalance = useTokenBalance(account ?? undefined, token as any);
  const [ethPrice] = useEthPrice()
  const screenerToken = useDexscreenerToken(address);
  const transactionData = useTokenTransactions(address, pairs, 5000);
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
  const _pairs = usePairs(params?.tokenAddress)

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

  // if they change chains on a chart page , need to redirect them back to the select charts page
  const chainChanged = Boolean(chainId) && Boolean(lastChainId) && chainId !== lastChainId
  React.useEffect(() => {
    if (chainChanged && Boolean(params?.tokenAddress)) {
      history.push(`/selective-charts`)
    }
  }, [chainChanged])


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
      if (!Boolean(Array.isArray(pairs) && pairs.length) && !screenerToken) return undefined

      if (screenerToken && screenerToken.quoteToken && screenerToken.quoteToken.address)
        return screenerToken.quoteToken.address

      return `${pairs?.[0]?.token0?.symbol?.toLowerCase() ===
        token?.symbol?.toLowerCase()
        ? pairs?.[0]?.token1?.id
        : pairs?.[0]?.token0?.id
        }`;
    },
    [tokenData, screenerToken, pairs, token]
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

  const [copied, copy] = useCopyClipboard()

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

  const shareClick = () => {
    if (navigator && navigator.share) {
      navigator.share({
        title: `KibaCharts - ${token?.symbol} / ${pairCurrency?.symbol}`,
        url: window.location.href
      }).then(() => {
        console.log(`[navigator.share]`, 'Thanks for sharing!');
      })
        .catch(console.error);
    } else {
      copy(window.location.href)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-between' }}>
        {Boolean(!chainId || chainId == 1) && ethPrice && <TYPE.small fontSize={12}>ETH <Badge>${parseFloat(parseFloat(ethPrice.toString()).toFixed(2)).toLocaleString()}</Badge> </TYPE.small>}
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
  }, [mainnetCurrency, chainId, ethPrice, pairCurrency, hasSelectedData]);
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

  const pairAddress = React.useMemo(() => {
    if (params?.pairAddress) return params?.pairAddress;
    let pairAddress = screenerToken?.pairAddress ? screenerToken?.pairAddress : pairs?.[0]?.id
    if (pairAddress) return pairAddress
    if (_pairs) {
      pairAddress = _pairs[0]?.id
    }
    return pairAddress
  }, [screenerToken, _pairs, pairs, params.pairAddress])

  return (
    <React.Suspense fallback={<BarChartLoaderSVG />}>
      {pairAddress && <Redirect to={`/selective-charts/${screenerToken?.chainId ? screenerToken?.chainId : 'ethereum'}/${pairAddress}`} />}
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
            borderLeft: (isMobile || !hasSelectedData)
              ? "none"
              : Boolean(
                params?.tokenAddress &&
                (selectedCurrency || !!prebuilt?.symbol)
              )
                ? "1px solid #444"
                : "none",
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
                  <ButtonOutlined padding={`3px`} style={{ padding: '3px !important', marginRight: 16 }} size={'sm'} onClick={shareClick}>
                    Share
                  </ButtonOutlined>
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
                      {Object.keys(screenerToken?.priceChange || {}).map((key) => (
                        <div
                          key={key}
                          style={{
                            paddingRight:
                              _.last(
                                Object.keys(screenerToken?.priceChange || {})
                              ) == key
                                ? 0
                                : 10,
                            borderRight:
                              _.last(
                                Object.keys(screenerToken?.priceChange || {})
                              ) == key
                                ? "none"
                                : "1px solid #444",
                          }}
                        >
                          <TYPE.small textAlign="center">
                            {formatPriceLabel(key)}
                          </TYPE.small>
                          <TYPE.black>
                            {(screenerToken?.priceChange as any)?.[key] < 0 ? (
                              <TrendingDown style={{ marginRight: 2, color: "red" }} />
                            ) : (
                              <TrendingUp style={{ marginRight: 2, color: "green" }} />
                            )}
                            {(screenerToken?.priceChange as any)?.[key]}%
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
                        pairAddress={pairAddress}
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
                        transactionData={transactionData}
                        tokenSymbol={
                          (params?.tokenSymbol ? params?.tokenSymbol : token?.symbol) as string
                        }
                        address={address as string}
                        pairs={pairAddress ? [{ id: pairAddress }, ...pairs] : pairs} />
                    </>
                  ) : null}
                </React.Fragment>
              )}
          </ChartWrapper>
        </div>
      </WrapperCard>
    </React.Suspense>
  );
};
