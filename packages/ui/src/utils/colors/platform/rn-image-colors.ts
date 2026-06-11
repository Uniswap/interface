// @ts-expect-error: this exists but is untyped
import { RNImageColors } from 'react-native-image-colors/lib/module/module.web'

// we're exporting this like this to avoid bringing all of react-native
// along for the ride for the web app, instead just import more directly

export default {
  getColors: RNImageColors.getColors,
}
