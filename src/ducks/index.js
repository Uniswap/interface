import { combineReducers } from 'redux';
import { drizzleReducers } from 'drizzle'
import addresses from './addresses';
import exchangeContracts from './exchange-contract';
import tokenContracts from './token-contract';
import exchange from './exchange';
import send from './send';
import swap from './swap';
import web3connect from './web3connect';

export default combineReducers({
  addresses,
  exchangeContracts,
  tokenContracts,
  exchange,
  send,
  swap,
  web3connect,
  ...drizzleReducers,
});
