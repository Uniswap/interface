import { StyleSheet } from 'react-native'
import { resizeModeContain } from 'src/styles/image'
import { theme } from 'src/styles/theme'

export const style = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.background3, // Equal to gray500 @ 24%
    resizeMode: resizeModeContain, // TODO. Default image?
  },
})
