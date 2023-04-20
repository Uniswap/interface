import './App.css'

import { Provider } from 'app/src/provider'
import { Store } from 'webext-redux'
import { WebNavigation } from 'app/src/navigation'

function App({ store }: { store: Store }): JSX.Element {
  return (
    <Provider store={store}>
      <WebNavigation />
    </Provider>
  )
}

export default App
