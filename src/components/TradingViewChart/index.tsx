import React, { useEffect, useState } from 'react'
import { ChartingLibraryWidgetOptions, LanguageCode, ResolutionString, Timezone } from './charting_library'
import styled from 'styled-components'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import useTheme from 'hooks/useTheme'
import { useUserLocale } from 'state/user/hooks'
import { ReactComponent as FullscreenOn } from 'assets/svg/fullscreen_on.svg'
import { ReactComponent as FullscreenOff } from 'assets/svg/fullscreen_off.svg'
import * as ReactDOMServer from 'react-dom/server'
import Portal from '@reach/portal'
import { isMobile } from 'react-device-detect'
import { useDatafeed } from './datafeed'

const ProLiveChartWrapper = styled.div<{ fullscreen: boolean }>`
  margin-top: 10px;
  height: ${isMobile ? '60vh' : 'calc(100% - 0px)'};
  border-radius: 10px;
  ${({ theme }) => `border: 1px solid ${theme.background};`}
  overflow: hidden;
  box-shadow: 0px 4px 16px rgb(0 0 0 / 4%);

  ${({ fullscreen }) =>
    fullscreen &&
    !isMobile &&
    `
    background-color: rgb(0,0,0,0.5);
    position: fixed;
    top: -15px;
    left: 0;
    z-index: 99999;
    padding-top: 82px;
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

  ${({ fullscreen }) => (fullscreen ? 'height: 100vh;' : 'padding-top: 10px;')}
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
const LOCALSTORAGE_STATE_NAME = 'proChartSavedState'

function ProLiveChart({
  currencies,
  stateProChart,
  className,
}: {
  currencies: any
  stateProChart?: any
  className?: string
}) {
  const theme = useTheme()
  const userLocale = useUserLocale()
  const { hasProChart, apiVersion, pairAddress } = stateProChart
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const datafeed = useDatafeed(currencies, pairAddress, apiVersion)

  useEffect(() => {
    if (!ref || !hasProChart) {
      return
    }
    setLoading(true)
    let widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: 'KNC',
      datafeed: datafeed,
      interval: '1H' as ResolutionString,
      container: ref,
      library_path: '/charting_library/',
      locale: (userLocale ? userLocale.slice(0, 2) : 'en') as LanguageCode,
      disabled_features: [
        'header_symbol_search',
        'header_fullscreen_button',
        'header_compare',
        'header_saveload',
        'drawing_templates',
      ],
      enabled_features: [
        'study_templates',
        'create_volume_indicator_by_default',
        'use_localstorage_for_settings',
        'save_chart_properties_to_local_storage',
      ],
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      theme: theme.darkMode ? 'Dark' : 'Light',
      custom_css_url: '/charting_library/style.css',
      timeframe: '2w',
      time_frames: [
        { text: '6m', resolution: '4H' as ResolutionString, description: '6 Months' },
        { text: '1m', resolution: '1H' as ResolutionString, description: '1 Month' },
        { text: '2w', resolution: '1H' as ResolutionString, description: '2 Weeks' },
        { text: '1w', resolution: '1H' as ResolutionString, description: '1 Week' },
        { text: '1d', resolution: '15' as ResolutionString, description: '1 Day' },
      ],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone,
    }
    let localStorageState = localStorage.getItem(LOCALSTORAGE_STATE_NAME)
    if (localStorageState) {
      widgetOptions.saved_data = JSON.parse(localStorageState)
    }
    const tvWidget = new window.TradingView.widget(widgetOptions)

    tvWidget.onChartReady(() => {
      tvWidget.applyOverrides({
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': theme.buttonBlack,
        'mainSeriesProperties.candleStyle.upColor': theme.primary,
        'mainSeriesProperties.candleStyle.borderUpColor': theme.primary,
        'mainSeriesProperties.candleStyle.wickUpColor': theme.primary,
        'mainSeriesProperties.candleStyle.downColor': theme.red,
        'mainSeriesProperties.candleStyle.borderDownColor': theme.red,
        'mainSeriesProperties.candleStyle.wickDownColor': theme.red,
      })
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
      tvWidget.subscribe('onAutoSaveNeeded', () => {
        tvWidget.save((object: any) => {
          localStorage.setItem(LOCALSTORAGE_STATE_NAME, JSON.stringify(object))
        })
      })
    })

    return () => {
      if (tvWidget !== null) {
        tvWidget.remove()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, userLocale, ref, pairAddress])

  return (
    <ProLiveChartWrapper fullscreen={fullscreen} onClick={() => setFullscreen(false)} className={className}>
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
