import { useEffect, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import WebView from 'react-native-webview'
import { Box } from 'ui/src/components/layout'
import { Loader } from 'ui/src/components/loading'
import { fetchSVG } from 'wallet/src/features/images/utils'
import { SvgUriProps } from 'wallet/src/features/images/WebSvgUri'
import { logger } from 'wallet/src/features/logger/logger'

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
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [aspectRatio, setDimensions] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function fetchSvg(): Promise<void> {
      try {
        const { content, aspectRatio: _aspectRatio } = await fetchSVG(uri, autoplay, signal)

        setSvgContent(content)
        setDimensions(_aspectRatio)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (Object.prototype.hasOwnProperty.call(err, 'name') && err.name === 'AbortError') {
          return // expect AbortError on unmount
        }
        logger.error('Failed to fetch remote SVG content', {
          tags: { file: 'WebSvgUri', function: 'fetchSvg' },
        })
      }
    }

    fetchSvg()

    return () => {
      // abort fetch on unmount
      controller.abort()
    }
  }, [autoplay, uri])

  if (svgContent && aspectRatio) {
    const html = getHTML(svgContent)

    return (
      <Box maxHeight={maxHeight ?? '100%'}>
        <WebView
          scalesPageToFit
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
              aspectRatio,
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
