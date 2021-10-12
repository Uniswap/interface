import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'

const sagaMiddleware = createSagaMiddleware({
  context: {
    accounts: walletContextValue.accounts,
    providers: walletContextValue.providers,
  },
})

export const store = configureStore({
  reducer: rootReducer,
  // Disable thunk, use saga instead
  middleware: (getDefaultMiddleware) => {
    return [...getDefaultMiddleware({ thunk: false }), sagaMiddleware]
  },
  devTools: config.debug,
})

sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
