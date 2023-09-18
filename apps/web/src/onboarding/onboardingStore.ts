import { combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { persistConfig } from 'src/background/reducer'
import { monitoredSagaReducers, webRootSaga } from 'src/background/saga'
import { loggerMiddleware } from 'src/background/utils/loggerMiddleware'
import { appearanceSettingsReducer } from 'wallet/src/features/appearance/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'
import { createStore } from 'wallet/src/state'

// Even though the onboarding flow and the main extension app have their own redux stores they are actually
// going to persist to the same place. When the onboarding flow is complete then the main extension app will
// read the persisted storage and load the onboarded wallets.
const onboardingReducer = persistReducer(
  persistConfig,
  combineReducers({
    appearanceSettings: appearanceSettingsReducer,
    wallet: walletReducer,
    saga: monitoredSagaReducers,
  })
)

export const store = createStore({
  reducer: onboardingReducer,
  additionalSagas: [webRootSaga],
  middlewareBefore: [loggerMiddleware],
})

export const persistor = persistStore(store)
