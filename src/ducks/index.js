import { combineReducers } from 'redux';
import { drizzleReducers } from 'drizzle'
import addresses from './addresses';
import send from './send';
import web3connect from './web3connect';

export default combineReducers({
  addresses,
  // exchangeContracts,
  // tokenContracts,
  // exchange,
  send,
  // swap,
  web3connect,
  ...drizzleReducers,
});
