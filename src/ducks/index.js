import { combineReducers } from 'redux';
import { drizzleReducers } from 'drizzle'
import addresses from './addresses';
import exchangeContracts from './exchange-contract';
import tokenContracts from './token-contract';
import exchange from './exchange';
import swap from './swap';

export default combineReducers({
  addresses,
  exchangeContracts,
  tokenContracts,
  exchange,
  swap,
  ...drizzleReducers,
});
