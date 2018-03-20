import { applyMiddleware, compose, createStore } from 'redux';
import reducer from '../reducers';
import thunk from 'redux-thunk'
import initSubscriber from 'redux-subscriber';
import initialState from './initial-state';

const middleware = [thunk];
const enhancers = [];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(applyMiddleware(...middleware), ...enhancers)
);
// redux-subscribe solution attempt 
// eslint-disable-next-line no-unused-vars
const subscribe = initSubscriber(store);

export default store;