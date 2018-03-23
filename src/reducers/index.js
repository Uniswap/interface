import { combineReducers } from 'redux';
// import global from './global-reducer';
import web3Store from './web3-reducer';
import exchangeContracts from './exchangeContract-reducer';
import tokenContracts from './tokenContract-reducer';
import exchange from './exchange-reducer';

export default combineReducers({
  web3Store,
  exchangeContracts,
  tokenContracts,
  exchange
});
