import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import * as ReactDOMServer from 'react-dom/server'
import { PoolResponse } from 'services/geckoTermial'
import styled from 'styled-components'

import { ReactComponent as FullscreenOff } from 'assets/svg/fullscreen_off.svg'
import { ReactComponent as FullscreenOn } from 'assets/svg/fullscreen_on.svg'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import { useUserLocale } from 'state/user/hooks'

import { ChartingLibraryWidgetOptions, LanguageCode, ResolutionString, Timezone } from './charting_library'
import { useDatafeed } from './datafeed'

const ProLiveChartWrapper = styled.div<{ fullscreen: boolean }>`
  height: ${isMobile ? '100%' : 'calc(100% - 0px)'};
  ${({ theme }) => `border: 1px solid ${theme.background};`}
  overflow: hidden;
  box-shadow: 0px 4px 16px rgb(0 0 0 / 4%);
  border-radius: ${isMobile ? '0' : '10px'};

  ${({ fullscreen }) =>
    fullscreen &&
    !isMobile &&
    `
    background-color: rgb(0,0,0,0.5);
    position: fixed;
    top: 0;
    left: 0;
    z-index: ${Z_INDEXS.LIVE_CHART};
    padding-top: 82px;
    height: 100% !important;
    width: 100% !important;
    border-radius: 0;
    margin:0;
  `}
`
const Loader = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const MobileChart = styled.div<{ fullscreen: boolean; $loading: boolean }>`
  height: 100%;
  width: 100%;
  bottom: 0;

  ${({ theme, fullscreen }) => !fullscreen && `border-bottom: solid 15px ${theme.buttonBlack};`}
  ${({ $loading }) => `display:${$loading ? 'none' : 'block'};`}
`

const LOCALSTORAGE_STATE_NAME = 'proChartSavedState'

function openFullscreen(elem: any) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.webkitRequestFullScreen) {
    /* Old webkit */
    elem.webkitRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) {
    /* New webkit */
    elem.webkitRequestFullscreen()
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen()
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen()
  }
}

interface FullScreenDocument extends Document {
  msExitFullscreen?: () => void
  mozCancelFullScreen?: () => void
  webkitExitFullscreen?: () => void
  webkitCancelFullScreen?: () => void
}

function closeFullscreen() {
  const doc = document as FullScreenDocument
  if (doc.exitFullscreen) {
    doc.exitFullscreen()
  } else if (doc.webkitCancelFullScreen) {
    /* Old webkit */
    doc.webkitCancelFullScreen()
  } else if (doc.webkitExitFullscreen) {
    /* New webkit */
    doc.webkitExitFullscreen()
  } else if (doc.mozCancelFullScreen) {
    doc.mozCancelFullScreen()
  } else if (doc.msExitFullscreen) {
    /* IE11 */
    doc.msExitFullscreen()
  }
}

function ProLiveChart({
  poolDetail,
  tokenId,
  className,
}: {
  poolDetail: PoolResponse
  // base token id
  tokenId: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const userLocale = useUserLocale()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const datafeed = useDatafeed(poolDetail, tokenId)

  useEffect(() => {
    if (!ref || !window.TradingView) {
      return
    }
    setLoading(true)

    const localStorageState = JSON.parse(localStorage.getItem(LOCALSTORAGE_STATE_NAME) || 'null')
    // set auto scale mode to true to fix wrong behavious of right axis price range
    if (localStorageState?.charts[0]?.panes[0]?.rightAxisesState[0]?.state?.m_isAutoScale === false) {
      localStorageState.charts[0].panes[0].rightAxisesState[0].state.m_isAutoScale = true
    }

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: 'KNC',
      datafeed,
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
      auto_save_delay: 2,
      saved_data: localStorageState,
    }
    const tvWidget = new window.TradingView.widget(widgetOptions)

    tvWidget.onChartReady(() => {
      setLoading(false)
      tvWidget.applyOverrides({
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': theme.darkMode ? theme.buttonBlack : theme.background,
        'mainSeriesProperties.candleStyle.upColor': theme.primary,
        'mainSeriesProperties.candleStyle.borderUpColor': theme.primary,
        'mainSeriesProperties.candleStyle.wickUpColor': theme.primary,
        'mainSeriesProperties.candleStyle.downColor': theme.red,
        'mainSeriesProperties.candleStyle.borderDownColor': theme.red,
        'mainSeriesProperties.candleStyle.wickDownColor': theme.red,
        'mainSeriesProperties.priceAxisProperties.autoScale': true,
        'scalesProperties.textColor': theme.text,
      })
      tvWidget.headerReady().then(() => {
        const fullscreenOn = tvWidget.createButton()
        fullscreenOn.setAttribute('title', 'Fullscreen on')
        fullscreenOn.addEventListener('click', () => {
          setFullscreen(fs => {
            if (isMobile) {
              if (fs) {
                closeFullscreen()
              } else {
                openFullscreen(ref)
              }
            }
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
  }, [theme, userLocale, ref, datafeed])

  return (
    <ProLiveChartWrapper fullscreen={fullscreen} onClick={() => setFullscreen(false)} className={className}>
      {loading && (
        <Loader>
          <AnimatedLoader />
        </Loader>
      )}

      {isMobile ? (
        <MobileChart
          id="mobile25235"
          ref={newRef => setRef(newRef)}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
          fullscreen={fullscreen}
          $loading={loading}
        />
      ) : (
        <div
          ref={newRef => setRef(newRef)}
          style={{ height: '100%', width: '100%', visibility: loading ? 'hidden' : 'visible' }}
          onClick={(e: any) => {
            e.stopPropagation()
          }}
        />
      )}
    </ProLiveChartWrapper>
  )
}

export default React.memo(ProLiveChart)
