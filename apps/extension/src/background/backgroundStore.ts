import { readIsOnboardedFromStorage, readReduxStateFromStorage } from 'src/background/utils/persistedStateUtils'
import { ExtensionState } from 'src/store/extensionReducer'
import { logger } from 'utilities/src/logger/logger'

type BackgroundState = {
  isOnboarded: boolean
}

const state: BackgroundState = {
  isOnboarded: false,
}

type OnboardingChangedListener = (isOnboarded: boolean) => void
const onboardingChangedListeners: OnboardingChangedListener[] = []

// Allows for multiple init attempts from different sources
let initPromise: Promise<void> | undefined

async function init(): Promise<void> {
  if (!initPromise) {
    initPromise = initInternal()
  }

  return initPromise
}

async function initInternal(): Promise<void> {
  try {
    const reduxState = await readReduxStateFromStorage()

    if (!reduxState) {
      logger.debug('backgroundStore.ts', 'initInternal', 'Failed to read redux state from storage')
    }

    await updateFromReduxState(reduxState)
    chrome.storage.local.onChanged.addListener(async (changes) => {
      const newReduxState = await readReduxStateFromStorage(changes)
      await updateFromReduxState(newReduxState)
    })
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'backgroundStore.ts',
        function: 'init',
      },
    })
  }
}

async function updateFromReduxState(reduxState: ExtensionState | undefined): Promise<void> {
  if (reduxState) {
    updateIsOnboarded(await readIsOnboardedFromStorage()) // Can replace this with selector after migration is complete
  }
}

function updateIsOnboarded(isOnboarded: boolean): void {
  if (isOnboarded !== state.isOnboarded) {
    state.isOnboarded = isOnboarded
    onboardingChangedListeners.forEach((listener) => listener(isOnboarded))
  }
}

function addOnboardingChangedListener(listener: OnboardingChangedListener): void {
  onboardingChangedListeners.push(listener)
}

export const backgroundStore = {
  state,
  init,
  addOnboardingChangedListener,
}
