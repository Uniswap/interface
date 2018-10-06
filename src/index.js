import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom'
import App from './pages/App';

import { Provider } from 'react-redux';
import store from './store';

import './index.css';

import registerServiceWorker from './registerServiceWorker';
// provider is going to need a store object passed into it 
ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App metamask={window.web3} />
    </BrowserRouter>
  </Provider>
, document.getElementById('root')
);

registerServiceWorker();
