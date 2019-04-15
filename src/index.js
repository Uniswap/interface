import React, { Suspense } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import ReactGA from 'react-ga'

import './i18n'
import App from './pages/App'
import store from './store'
import './index.scss'

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-128182339-1')
} else {
  ReactGA.initialize('test', { testMode: true })
}

ReactGA.pageview(window.location.pathname + window.location.search)

ReactDOM.render(
  // catch the suspense in case translations are not yet loaded
  <Suspense fallback={null}>
    <Provider store={store}>
      <App />
    </Provider>
  </Suspense>,
  document.getElementById('root')
)
