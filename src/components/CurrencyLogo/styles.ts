import { ShadowProps } from '@shopify/restyle'
import { StyleSheet } from 'react-native'
import { resizeModeContain } from 'src/styles/image'
import { Theme } from 'src/styles/theme'

export const style = StyleSheet.create({
  image: {
    resizeMode: resizeModeContain,
  },
})

export const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

export const THIN_BORDER = 0.5
