import { applyMiddleware, compose, createStore } from 'redux';
import reducer from '../reducers';
import thunk from 'redux-thunk'
import initialState from './initial-state';

const middleware = [thunk];
const enhancers = [];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware), ...enhancers)
)

export default store;