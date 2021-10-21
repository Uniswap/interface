import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { historicalChainData } from 'src/features/historicalChainData/slice'

const sagaMiddleware = createSagaMiddleware({
  context: {
    accounts: walletContextValue.accounts,
    providers: walletContextValue.providers,
    contracts: walletContextValue.contracts,
  },
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    return [
      // Disable thunk, use saga instead
      ...getDefaultMiddleware({ thunk: false }),
      sagaMiddleware,
      historicalChainData.middleware,
    ]
  },
  devTools: config.debug,
})

sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
