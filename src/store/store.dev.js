import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk'
import initialState from './initial-state';
import reducer from '../ducks';
import createSagaMiddleware from 'redux-saga';
import { all, fork } from 'redux-saga/effects'
import { drizzleSagas } from 'drizzle'

function* root() {
  yield all(
    drizzleSagas.map(saga => fork(saga))
  )
}

const sagaMiddleware = createSagaMiddleware();

const middleware = [thunk, sagaMiddleware];
const enhancers = [];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  initialState,
  composeEnhancers(
    applyMiddleware(...middleware),
    ...enhancers,
  )
);

sagaMiddleware.run(root);

export default store;