import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Splashscreen from './components/misc/Splashscreen'
import registerServiceWorker from './registerServiceWorker';

function Detect(props) {
  const metamask = props.metamask;
  if(typeof metamask === 'undefined') {
    return <Splashscreen />
  }
  else {
    return <App />
  }
}

ReactDOM.render(
   <Detect metamask={window.web3} />, document.getElementById('root')
);
registerServiceWorker();
