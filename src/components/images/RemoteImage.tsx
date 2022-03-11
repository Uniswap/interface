import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image } from 'react-native'
import WebView from 'react-native-webview'
import { CenterBox } from 'src/components/layout/CenterBox'
import { resizeModeContain } from 'src/styles/image'
import { logger } from 'src/utils/logger'
import { uriToHttp } from 'src/utils/uriToHttp'

type Props = {
  borderRadius: number
  imageUrl: string
  height: number
  width: number
}

const getHTML = (svgContent: string) => {
  return `
<html>
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no"> 
  <script>
    function overLoadFunctions() {
      window.alert = () => false;
      window.prompt = () => false;
      window.confirm  = () => false;
    }
    overLoadFunctions();
    window.onload = overLoadFunctions();
  </script>
  <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
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
</html>`
}

export function RemoteImage({ borderRadius, imageUrl, height, width }: Props) {
  const [svgHtml, setSvgHtml] = useState('')

  const imageHttpUrl = uriToHttp(imageUrl)[0]

  useEffect(() => {
    async function fetchSvg() {
      try {
        const res = await fetch(imageHttpUrl)
        const svgContent = await res.text()
        const html = getHTML(svgContent)
        setSvgHtml(html)
      } catch (err) {
        logger.error('RemoteImage', 'fetchSvg', 'Failed to fetch remote SVG content', err)
      }
    }

    if (imageHttpUrl?.includes('.svg')) {
      fetchSvg()
    }
  }, [imageHttpUrl])

  if (!imageHttpUrl) return null

  if (imageHttpUrl.endsWith('.svg')) {
    return svgHtml ? (
      <WebView
        javaScriptEnabled={false}
        originWhitelist={['*']}
        scalesPageToFit={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        source={{ html: svgHtml }}
        style={{
          borderRadius,
          width,
          height,
          ...webviewStyle,
        }}
        useWebKit={false}
      />
    ) : (
      <CenterBox height={height} width={width}>
        <ActivityIndicator />
      </CenterBox>
    )
  }

  return (
    <Image
      source={{ uri: imageHttpUrl }}
      style={{
        borderRadius,
        height,
        resizeMode: resizeModeContain,
        width,
      }}
    />
  )
}

const webviewStyle = { backgroundColor: 'transparent' }
