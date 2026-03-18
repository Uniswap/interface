import WebView from 'react-native-webview'
import { Flex } from 'ui/src/components/layout/Flex'
import { SvgImageProps } from 'ui/src/components/UniversalImage/types'
import { useSvgData } from 'ui/src/components/UniversalImage/utils'
import { Loader } from 'ui/src/loading/Loader'
import { isIOS } from 'utilities/src/platform'

const heightUnits = isIOS ? 'vh' : '%'

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

export function SvgImage({ uri, size, autoplay, fallback }: SvgImageProps): JSX.Element | null {
  const svgData = useSvgData(uri, autoplay)

  if (!svgData?.content || !svgData.aspectRatio) {
    return fallback ?? <Loader.Image />
  }

  const html = getHTML(svgData.content)

  const aspectRatio = size.aspectRatio ?? svgData.aspectRatio

  return (
    <Flex aspectRatio={aspectRatio} maxHeight={size.height ?? '100%'}>
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
        style={{
          aspectRatio,
          backgroundColor: 'transparent',
          height: '100%',
          width: '100%',
        }}
        useWebKit={false}
      />
    </Flex>
  )
}
