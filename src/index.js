import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import WebFont from 'webfontloader';
import './i18n';
import App from './pages/App';
import store from './store';

import 'antd/dist/antd.css';
import './index.scss';

WebFont.load({
  google: {
    families: [
      'Rubik:900',
      'Karla'
    ]
  }
});

window.addEventListener('load', function () {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>, document.getElementById('root')
  );
});
