import { combineReducers } from 'redux';
import web3 from './web3-reducer';
import exchangeContracts from './exchangeContract-reducer';
import tokenContracts from './tokenContract-reducer';
import exchange from './exchange-reducer';

export default combineReducers({
  web3,
  exchangeContracts,
  tokenContracts,
  exchange
});