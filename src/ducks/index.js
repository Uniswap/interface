import { combineReducers } from 'redux'
import addresses from './addresses'
import app from './app'
import pending from './pending'
import web3connect from './web3connect'

export default combineReducers({
  app,
  addresses,
  pending,
  web3connect
})
