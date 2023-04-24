import React, { useEffect, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import WebView from 'react-native-webview'
import { fetchSVG } from 'src/components/images/utils'
import { Loader } from 'src/components/loading'
import { logger } from 'src/utils/logger'

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

type SvgUriProps = {
  autoplay: boolean
  maxHeight?: number
  uri: string
}

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
        logger.error('SvgUri', 'fetchSvg', 'Failed to fetch remote SVG content', err)
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
          webviewStyle.fullWidth,
          {
            aspectRatio,
            maxHeight: maxHeight ?? '100%',
          },
        ]}
        useWebKit={false}
      />
    )
  } else {
    return <Loader.Image />
  }
}

const webviewStyle = StyleSheet.create({
  fullWidth: {
    backgroundColor: 'transparent',
    maxHeight: 350,
    width: '100%',
  },
})
