import { useCallback } from 'react'
import { Platform, StyleSheet } from 'react-native'
import WebView from 'react-native-webview'
import { Box } from 'ui/src'
import { Loader } from 'ui/src/loading'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { fetchSVG } from 'wallet/src/features/images/utils'
import { SvgUriProps } from 'wallet/src/features/images/WebSvgUri'

const heightUnits = Platform.OS === 'ios' ? 'vh' : '%'

const getHTML = (svgContent: string): string => `
<html>
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no">
  <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100${heightUnits};
        width: 100${heightUnits};
        overflow: hidden;
        background-color: transparent;
      }
      svg {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      * {
        -webkit-user-select: none;
      }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>
`

/* Re-implementation of `react-native-svg#SvgUri` that has better SVG support (animations, text, etc.) */
export function WebSvgUri({ autoplay, maxHeight, uri }: SvgUriProps): JSX.Element {
  const fetchSvgData = useCallback(async () => {
    const controller = new AbortController()
    const signal = controller.signal

    try {
      return await fetchSVG(uri, autoplay, signal)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (Object.prototype.hasOwnProperty.call(error, 'name') && error.name === 'AbortError') {
        return // expect AbortError on unmount
      }
      logger.error(error, { tags: { file: 'WebSvgUri', function: 'fetchSvg', uri } })
    }
  }, [autoplay, uri])

  const svgData = useAsyncData(fetchSvgData).data

  if (svgData?.content && svgData?.aspectRatio) {
    const html = getHTML(svgData.content)

    return (
      <Box maxHeight={maxHeight ?? '100%'}>
        <WebView
          scalesPageToFit
          androidLayerType="hardware"
          geolocationEnabled={false}
          javaScriptEnabled={false}
          originWhitelist={['*']}
          pointerEvents="none"
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          source={{ html }}
          style={[
            webviewStyle.fullSize,
            {
              aspectRatio: svgData.aspectRatio,
            },
          ]}
          useWebKit={false}
        />
      </Box>
    )
  } else {
    return <Loader.Image />
  }
}

const webviewStyle = StyleSheet.create({
  fullSize: {
    backgroundColor: 'transparent',
    height: '100%',
    width: '100%',
  },
})
