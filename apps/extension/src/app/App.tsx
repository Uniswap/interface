import './App.css'

import { Provider } from 'app/src/provider'
import { WebNavigation } from 'app/src/navigation'

function App({ store }: { store: any }): JSX.Element {
  return (
    <Provider store={store}>
      <WebNavigation />
    </Provider>
  )
}

export default App
