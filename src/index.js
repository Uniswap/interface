import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import ReactGA from 'react-ga';
import App from './pages/App';
import store from './store';

import './index.scss';

ReactGA.initialize('UA-128182339-1');
ReactGA.pageview(window.location.pathname + window.location.search);

window.addEventListener('load', function() {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>
    , document.getElementById('root')
  );
});

