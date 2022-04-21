import React, { useEffect, useState } from 'react'
import {
  widget,
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
} from './charting_library'
import styled from 'styled-components'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import useTheme from 'hooks/useTheme'
import { useUserLocale } from 'state/user/hooks'
import { ReactComponent as FullscreenOn } from 'assets/svg/fullscreen_on.svg'
import { ReactComponent as FullscreenOff } from 'assets/svg/fullscreen_off.svg'
import * as ReactDOMServer from 'react-dom/server'
import Portal from '@reach/portal'
import { isMobile } from 'react-device-detect'
import { getTimeframeMilliseconds, useDatafeed } from './datafeed'
import useLiveChartData, { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import { Token } from '@dynamic-amm/sdk'

const ProLiveChartWrapper = styled.div<{ fullscreen: boolean }>`
  margin-top: 10px;
  height: ${isMobile ? '60vh' : 'calc(100% - 0px)'};
  width: 100%;
  border-radius: 10px;
  ${({ theme }) => `border: 1px solid ${theme.background};`}
  overflow: hidden;
  box-shadow: 0px 4px 16px rgb(0 0 0 / 4%);

  ${({ fullscreen }) =>
    fullscreen &&
    !isMobile &&
    `
    background-color: rgb(0,0,0,0.6);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99999;
    padding-top: 84px;
    height: 100%!important;
    width: 100%!important;
    border-radius: 0;
    margin:0;
  `}

  ${isMobile && 'height: 60vh; border-radius: 0;'}
`
const Loader = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const MobileChart = styled.div<{ fullscreen: boolean; loading: boolean }>`
  height: 60vh;
  width: 100%;
  position: fixed;
  z-index: 100000;
  bottom: 0;
  ${({ fullscreen }) => fullscreen && `height:calc(100vh - 65px);`}
  ${({ loading }) => `display:${loading ? 'none' : 'block'}`}
`

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol']
  interval: ChartingLibraryWidgetOptions['interval']

  // BEWARE: no trailing slash is expected in feed URL
  datafeedUrl: string
  libraryPath: ChartingLibraryWidgetOptions['library_path']
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']
  clientId: ChartingLibraryWidgetOptions['client_id']
  userId: ChartingLibraryWidgetOptions['user_id']
  fullscreen: ChartingLibraryWidgetOptions['fullscreen']
  autosize: ChartingLibraryWidgetOptions['autosize']
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides']
  container: ChartingLibraryWidgetOptions['container']
  onReady: () => void
}

export interface ChartContainerState {}

const getInterval = (timeframe: LiveDataTimeframeEnum) => {
  switch (timeframe) {
    case LiveDataTimeframeEnum.HOUR: 
      return '5'
    case LiveDataTimeframeEnum.FOUR_HOURS: 
    return '5'
    case LiveDataTimeframeEnum.DAY: 
    return '15'
    case LiveDataTimeframeEnum.WEEK: 
    return '1H'
    case LiveDataTimeframeEnum.MONTH: 
    return '1H'
    case LiveDataTimeframeEnum.SIX_MONTHS: 
    return '4H'
  }
}
function ProLiveChart({ tokens }: { tokens: (Token | null | undefined)[] }) {
  const theme = useTheme()
  const userLocale = useUserLocale()

  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [timeFrame, setTimeFrame] = useState<LiveDataTimeframeEnum>(LiveDataTimeframeEnum.DAY)
  const { data: chartData } = useLiveChartData(tokens,timeFrame)
  const datafeed = useDatafeed(chartData,timeFrame)

  useEffect(() => {
    if (!ref) {
      return
    }
    setLoading(true)
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: 'AAPL',
      datafeed: datafeed,
      interval: getInterval(timeFrame) as ResolutionString,
      container: ref,
      library_path: '/charting_library/',
      locale: (userLocale ? userLocale.slice(0, 2) : 'en') as LanguageCode,
      disabled_features: [
        'use_localstorage_for_settings',
        'header_symbol_search',
        'header_fullscreen_button',
        'header_compare',
        'header_saveload',
        'drawing_templates',
      ],
      enabled_features: ['study_templates', 'fix_left_edge'],
      charts_storage_url: 'https://saveload.tradingview.com',
      charts_storage_api_version: '1.1',
      client_id: 'tradingview.com',
      user_id: 'public_user_id',
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      theme: theme.darkMode ? 'Dark' : 'Light',
      custom_css_url: '/charting_library/style.css',
      timeframe: timeFrame as ResolutionString,
      time_frames: [
        // { text: '6m', resolution: '4H' as ResolutionString, description: '6 Months' },
        { text: '1m', resolution: '1H' as ResolutionString, description: '1 Month' },
        { text: '1w', resolution: '1H' as ResolutionString, description: '1 Week' },
        { text: '1d', resolution: '15' as ResolutionString, description: '1 Day' },
        // { text: '4h', resolution: '5' as ResolutionString, description: '4 Hours' },
        // { text: '1h', resolution: '5' as ResolutionString, description: '1 Hour' },
      ],
      timezone: 'Asia/Ho_Chi_Minh' 
    }
    const tvWidget = new widget(widgetOptions)
    tvWidget.applyOverrides({
      'paneProperties.backgroundType': 'solid',
      'paneProperties.background': theme.buttonBlack,
      'mainSeriesProperties.candleStyle.upColor': theme.primary,
      'mainSeriesProperties.candleStyle.borderUpColor': theme.primary,
      'mainSeriesProperties.candleStyle.wickUpColor': theme.primary,
    })
    tvWidget.onChartReady(() => {
      setLoading(false)
      tvWidget.headerReady().then(() => {
        const fullscreenOn = tvWidget.createButton()
        fullscreenOn.setAttribute('title', 'Fullscreen on')
        fullscreenOn.addEventListener('click', () => {
          setFullscreen(fs => {
            fullscreenOn.innerHTML = ReactDOMServer.renderToStaticMarkup(fs ? <FullscreenOn /> : <FullscreenOff />)
            return !fs
          })
        })
        fullscreenOn.innerHTML = ReactDOMServer.renderToStaticMarkup(<FullscreenOn />)
      })
      tvWidget.activeChart().setVisibleRange(
        { from: (new Date().getTime() - getTimeframeMilliseconds(timeFrame)) / 1000, to: new Date().getTime() / 1000 },
      )
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval, timeframeObj:any) => {
          console.log('🚀 ~ file: index.tsx ~ line 160 ~ tvWidget.activeChart ~ interval', interval)
          console.log('🚀 ~ file: index.tsx ~ line 160 ~ tvWidget.activeChart ~ timeframeObj', timeframeObj)
          timeframeObj?.timeframe?.value && setTimeFrame(timeframeObj?.timeframe?.value as LiveDataTimeframeEnum)
        })
    })

    return () => {
      if (tvWidget !== null) {
        tvWidget.remove()
      }
    }
  }, [theme, userLocale, ref, chartData])

  return (
    <ProLiveChartWrapper fullscreen={fullscreen} onClick={() => setFullscreen(false)}>
      {loading && (
        <Loader>
          <AnimatedLoader />
        </Loader>
      )}

      {isMobile ? (
        <Portal>
          <MobileChart
            id="mobile25235"
            ref={newRef => setRef(newRef)}
            onClick={(e: any) => {
              e.stopPropagation()
            }}
            fullscreen={fullscreen}
            loading={loading}
          ></MobileChart>
        </Portal>
      ) : (
        <div
          ref={newRef => setRef(newRef)}
          style={{ height: '100%', width: '100%', display: loading ? 'none' : 'block' }}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
        ></div>
      )}
    </ProLiveChartWrapper>
  )
}

export default ProLiveChart
