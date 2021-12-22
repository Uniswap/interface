import { StyleSheet } from 'react-native'

export const FULL_SNAP_POINTS = ['92%']

export const bottomSheetStyles = StyleSheet.create({
  bottomSheet: {
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
})
