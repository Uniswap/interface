import React from 'react';
import ReactDOM from 'react-dom';
import { DrizzleProvider } from 'drizzle-react';
import App from './pages/App';
import store from './store';

import './index.scss';

window.addEventListener('load', function() {
  ReactDOM.render(
    <DrizzleProvider options={{
      contracts: [],
      events: [],
      polls: { accounts: 3000, blocks: 3000 },
    }} store={store}>
      <App />
    </DrizzleProvider>
    , document.getElementById('root')
  );
});

