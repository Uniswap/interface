import * as WebBrowser from 'expo-web-browser'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { call } from 'typed-redux-saga'

export function* handleTransactionLink(url: URL) {
  yield* call(navigate, Screens.Activity)
  const fiatOnRamp = url.searchParams.get('fiatOnRamp')
  if (fiatOnRamp) {
    WebBrowser.dismissBrowser()
  }
}
