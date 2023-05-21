import { useEffect, useRef, useMemo } from 'react';
import {
	widget,
	ChartingLibraryWidgetOptions,
	LanguageCode,
	ResolutionString,
	IChartingLibraryWidget
} from 'public/charting_library';
import { useState } from 'react';
import { defaultChartProps, DEFAULT_PERIOD, disabledFeaturesOnMobile } from "./constants";
import useDatafeed from "./useDataFeed";
import { FeeAmount, Pool, computePoolAddress } from '@uniswap/v3-sdk';
import { Currency, Token } from '@uniswap/sdk-core';
import { useUniswapSubgraph } from 'graphql/limitlessGraph/uniswapClients';
import { useLimitlessSubgraph } from 'graphql/limitlessGraph/limitlessClients';
import { V3_CORE_FACTORY_ADDRESSES as UNISWAP_FACTORIES } from "constants/addresses-uniswap"
import { V3_CORE_FACTORY_ADDRESSES as LIMITLESS_FACTORIES, POOL_INIT_CODE_HASH, UNISWAP_POOL_INIT_CODE_HASH, feth, fusdc } from "constants/addresses"
import { useContract } from 'hooks/useContract';
import { abi as IUniswapV3PoolStateABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { Interface } from '@ethersproject/abi'
import { usePool } from 'hooks/usePools';
import { useCurrency } from 'hooks/Tokens';
import { convertBNToStr } from 'hooks/useV3Positions';
import { LoadingRows } from 'components/Loader/styled';
import { ThemedText } from 'theme';

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI)

export interface ChartContainerProps {
	symbol: ChartingLibraryWidgetOptions['symbol'];
	interval: ChartingLibraryWidgetOptions['interval'];

	// BEWARE: no trailing slash is expected in feed URL
	datafeedUrl: string;
	libraryPath: ChartingLibraryWidgetOptions['library_path'];
	chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
	chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
	clientId: ChartingLibraryWidgetOptions['client_id'];
	userId: ChartingLibraryWidgetOptions['user_id'];
	fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
	autosize: ChartingLibraryWidgetOptions['autosize'];
	studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
	container: ChartingLibraryWidgetOptions['container'];
}

const getLanguageFromURL = (): LanguageCode | null => {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode;
};

export const TVChartContainer = ({
	chainId,
	token0,
	token1,
	fee
}: {
	chainId: number;
	token0: Token | undefined,
	token1: Token | undefined,
	fee: FeeAmount | undefined,
}) => {
	const chartContainerRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;
	const { datafeed } = useDatafeed({ chainId });
	const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
	const [chartReady, setChartReady] = useState(false);
	const [chartDataLoading, setChartDataLoading] = useState(true);

	const uniswapPoolAddress = useMemo(() => {
		if (chainId && token0 && token1 && fee) {
			return computePoolAddress({
				factoryAddress: UNISWAP_FACTORIES[42161],
				tokenA: token0,
				tokenB: token1,
				fee,
				initCodeHashManualOverride: UNISWAP_POOL_INIT_CODE_HASH
			}).toLowerCase()
		}
		return undefined
	}, [chainId, token0, token1, fee])

	const limitlessPoolAddress = useMemo(() => {
		if (chainId && token0 && token1 && fee) {
			return computePoolAddress({
				factoryAddress: LIMITLESS_FACTORIES[chainId],
				tokenA: token0,
				tokenB: token1,
				fee,
				initCodeHashManualOverride: POOL_INIT_CODE_HASH
			}).toLowerCase()
		}
		return undefined
	}, [chainId, token0, token1, fee])

	const uniswapPoolContract = useContract(uniswapPoolAddress, POOL_STATE_INTERFACE)

	const [uniswapPoolExists, setUniswapPoolExists] = useState(false)
	const [uniswapToken0Price, setUniswapToken0Price] = useState<number | undefined>()
	const currency0 = useCurrency(token0?.address)
	const currency1 = useCurrency(token1?.address)
	const [poolState, limitlessPool] = usePool(currency0 ?? undefined, currency1 ?? undefined, fee)
	const [symbol, setSymbol] = useState("missing pool")
	

	useEffect(() => {
		async function fetch() {
			if (uniswapPoolAddress && uniswapPoolContract) {
				try {
					const token0Price = await uniswapPoolContract.callStatic.token0Price()
					if (token0Price) {
						setUniswapPoolExists(true)
						setUniswapToken0Price(Number(convertBNToStr(token0Price, 18)))
					}
				} catch (err) {
					console.log("err: ", err)
				}
			}
		}
		fetch()
	}, [uniswapPoolAddress])

	useEffect(() => {
		if (token0?.address.toLowerCase() === fusdc.toLowerCase() && token1?.address.toLowerCase() === feth.toLowerCase()) {
			setSymbol(JSON.stringify(
				{
					poolAddress: "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443",
					baseSymbol: "fETH",
					quoteSymbol: "fUSDC",
					invertPrice: true,
					useUniswapSubgraph: true
				}
			))
		}
		else if (
			uniswapPoolExists
			&& uniswapToken0Price
			&& uniswapPoolAddress
		) {
			const token0IsBase = uniswapToken0Price > 1;
			setSymbol(JSON.stringify(
				{
					poolAddress: uniswapPoolAddress,
					baseSymbol: token0IsBase ? token0?.symbol : token1?.symbol,
					quoteSymbol: token0IsBase ? token1?.symbol : token0?.symbol,
					invertPrice: !token0IsBase,
					useUniswapSubgraph: true
				}
			))
		} else if (
			!uniswapPoolExists
			&& limitlessPoolAddress
			&& limitlessPool
		) {
			const token0IsBase = limitlessPool.token0Price.greaterThan(1);
			setSymbol(JSON.stringify(
				{
					poolAddress: limitlessPoolAddress,
					baseSymbol: token0IsBase ? token0?.symbol : token1?.symbol,
					quoteSymbol: token0IsBase ? token1?.symbol : token0?.symbol,
					invertPrice: !token0IsBase,
					useUniswapSubgraph: false
				}))
		}
	}, [token0, token1])

	useEffect(() => {
		// console.log("symbolExchangeChart: ", symbol)
		const widgetOptions = {
			debug: true,
			symbol: !symbol ? "missing pool" : symbol,
			datafeed: datafeed,
			theme: defaultChartProps.theme,
			container: chartContainerRef.current,
			library_path: defaultChartProps.library_path,
			locale: defaultChartProps.locale,
			loading_screen: defaultChartProps.loading_screen,
			enabled_features: defaultChartProps.enabled_features,
			disabled_features: defaultChartProps.disabled_features,
			client_id: defaultChartProps.clientId,
			user_id: defaultChartProps.userId,
			//fullscreen: defaultChartProps.fullscreen,
			// autosize: defaultChartProps.autosize,
			custom_css_url: defaultChartProps.custom_css_url,
			autosize: true,
			overrides: defaultChartProps.overrides,
			interval: "60",//getObjectKeyFromValue(period, SUPPORTED_RESOLUTIONS),
			favorites: defaultChartProps.favorites,
			custom_formatters: defaultChartProps.custom_formatters,
			// save_load_adapter: new SaveLoadAdapter(chainId, tvCharts, setTvCharts, onSelectToken),
		};

		tvWidgetRef.current = new widget(widgetOptions as any);

		tvWidgetRef.current!.onChartReady(function () {
      setChartReady(true);

      tvWidgetRef.current?.activeChart().dataReady(() => {
        setChartDataLoading(false);
      });
    });


		return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
        setChartReady(false);
        setChartDataLoading(true);
      }
    };
	}, [chainId, symbol]);

	return (
		<div style={{height: "450px"}}>
			{/* {symbol === "" && (
				<ThemedText.BodyPrimary>
					Pool not found
				</ThemedText.BodyPrimary>
			)} */}
			<div
			style={{
				height: '100%'
			}}
			ref={chartContainerRef}
			className={'TVChartContainer'}
		/>
		</div>
		
	);
};