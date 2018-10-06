import { combineReducers } from 'redux';
// import global from './global-reducer';
import web3Store from './web3';
import exchangeContracts from './exchange-contract';
import tokenContracts from './token-contract';
import exchange from './exchange';

export default combineReducers({
  web3Store,
  exchangeContracts,
  tokenContracts,
  exchange
});
