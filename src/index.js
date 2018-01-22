import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App metamask={window.web3} />, document.getElementById('root'));
registerServiceWorker();
