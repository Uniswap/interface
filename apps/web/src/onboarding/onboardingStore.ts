import { combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { persistConfig } from 'src/background/reducer'
import { monitoredSagaReducers, webRootSaga } from 'src/background/saga'
import { loggerMiddleware } from 'src/background/utils/loggerMiddleware'
import { createStore } from 'wallet/src/state'
import { sharedReducers } from 'wallet/src/state/reducer'

// Even though the onboarding flow and the main extension app have their own redux stores they are actually
// going to persist to the same place. When the onboarding flow is complete then the main extension app will
// read the persisted storage and load the onboarded wallets.
const onboardingReducer = persistReducer(
  persistConfig,
  combineReducers({ saga: monitoredSagaReducers, ...sharedReducers })
)

export const store = createStore({
  reducer: onboardingReducer,
  additionalSagas: [webRootSaga],
  middlewareBefore: [loggerMiddleware],
})

export const persistor = persistStore(store)
