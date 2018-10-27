import { combineReducers } from 'redux';
import addresses from './addresses';
import send from './send';
import web3connect from './web3connect';

export default combineReducers({
  addresses,
  send,
  web3connect,
});
