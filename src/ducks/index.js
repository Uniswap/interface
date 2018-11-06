import { combineReducers } from 'redux';
import addresses from './addresses';
import send from './send';
import app from './app';
import pending from './pending';
import web3connect from './web3connect';

export default combineReducers({
  app,
  addresses,
  pending,
  send,
  web3connect,
});
