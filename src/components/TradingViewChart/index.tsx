import * as React from 'react'
import {
  widget,
  ChartingLibraryWidgetOptions,
  LanguageCode,
  IChartingLibraryWidget,
  ResolutionString,
} from './charting_library'
import styled from 'styled-components'

const ProLiveChartWrapper = styled.div`
  margin-top: 10px;
  min-height: 600px;
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
}

export interface ChartContainerState {}

export class ProLiveChart extends React.PureComponent<Partial<ChartContainerProps>, ChartContainerState> {
  public static defaultProps: Omit<ChartContainerProps, 'container'> = {
    symbol: 'AAPL',
    interval: 'D' as ResolutionString,
    datafeedUrl: 'https://demo_feed.tradingview.com',
    libraryPath: '/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    clientId: 'tradingview.com',
    userId: 'public_user_id',
    fullscreen: false,
    autosize: false,
    studiesOverrides: {},
  }

  private tvWidget: IChartingLibraryWidget | null = null
  private ref: React.RefObject<HTMLDivElement> = React.createRef()

  public componentDidMount(): void {
    if (!this.ref.current) {
      return
    }
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: this.props.symbol as string,
      // BEWARE: no trailing slash is expected in feed URL
      // tslint:disable-next-line:no-any
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(this.props.datafeedUrl),
      interval: this.props.interval as ChartingLibraryWidgetOptions['interval'],
      container: this.ref.current,
      library_path: this.props.libraryPath as string,

      locale: 'en',
      disabled_features: ['use_localstorage_for_settings', 'header_symbol_search'],
      enabled_features: ['study_templates'],
      charts_storage_url: this.props.chartsStorageUrl,
      charts_storage_api_version: this.props.chartsStorageApiVersion,
      client_id: this.props.clientId,
      user_id: this.props.userId,
      fullscreen: this.props.fullscreen,
      autosize: this.props.autosize,
      studies_overrides: this.props.studiesOverrides,
      theme: 'Dark',
      height: 600,
      custom_css_url: '/charting_library/style.css',
    }

    const tvWidget = new widget(widgetOptions)
    this.tvWidget = tvWidget
    tvWidget.applyOverrides({
      'paneProperties.backgroundType': 'solid',
      'paneProperties.background': '#11171a',
      'mainSeriesProperties.candleStyle.upColor': '#31cb9e',
      'mainSeriesProperties.candleStyle.borderUpColor': '#31cb9e',
      'mainSeriesProperties.candleStyle.wickUpColor': '#31cb9e',
    })
    // tvWidget.onChartReady(() => {
    //   tvWidget.headerReady().then(() => {
    //     const button = tvWidget.createButton()
    //     button.setAttribute('title', 'Click to show a notification popup')
    //     button.classList.add('apply-common-tooltip')
    //     button.addEventListener('click', () =>
    //       tvWidget.showNoticeDialog({
    //         title: 'Notification',
    //         body: 'TradingView Charting Library API works correctly',
    //         callback: () => {
    //           console.log('Noticed!')
    //         },
    //       }),
    //     )
    //     button.innerHTML = 'Check API'
    //   })
    // })
  }

  public componentWillUnmount(): void {
    if (this.tvWidget !== null) {
      this.tvWidget.remove()
      this.tvWidget = null
    }
  }

  public render(): JSX.Element {
    return <ProLiveChartWrapper ref={this.ref} />
  }
}
