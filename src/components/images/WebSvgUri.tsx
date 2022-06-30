import React, { useEffect, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import WebView from 'react-native-webview'
import { fetchSVG } from 'src/components/images/utils'
import { Loading } from 'src/components/loading'
import { logger } from 'src/utils/logger'

const heightUnits = Platform.OS === 'ios' ? 'vh' : '%'

const getHTML = (svgContent: string) => `
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

    </style>
  </head>
  <body>
    ${svgContent}
  </body>
</html>
`

type SvgUriProps = {
  uri: string
}

/* Re-implementation of `react-native-svg#SvgUri` that has better SVG support (animations, text, etc.) */
export function WebSvgUri({ uri }: SvgUriProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [{ width, height }, setDimensions] = useState<{ width?: number; height?: number }>({})

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function fetchSvg() {
      try {
        const { content, viewboxWidth, viewboxHeight } = await fetchSVG(uri, signal)

        setSvgContent(content)
        setDimensions({ width: viewboxWidth, height: viewboxHeight })
      } catch (err: any) {
        if (err.hasOwnProperty('name') && err.name === 'AbortError') {
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
  }, [uri])

  if (svgContent && width && height) {
    const html = getHTML(svgContent)

    return (
      <WebView
        scalesPageToFit
        javaScriptEnabled={false}
        originWhitelist={['*']}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={{ html }}
        style={[
          webviewStyle.fullWidth,
          {
            aspectRatio: width / height,
          },
        ]}
        useWebKit={false}
      />
    )
  } else {
    return <Loading type="image" />
  }
}

const webviewStyle = StyleSheet.create({
  fullWidth: {
    backgroundColor: 'transparent',
    maxHeight: 350,
    width: '100%',
  },
})
