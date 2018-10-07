import React from 'react';
import ReactDOM from 'react-dom';
import Web3 from 'web3';
import App from './pages/App';

import { Provider } from 'react-redux';
import store from './store';

import './index.scss';

import registerServiceWorker from './registerServiceWorker';

window.addEventListener('load', function() {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>
    , document.getElementById('root')
  );

  registerServiceWorker();
});

