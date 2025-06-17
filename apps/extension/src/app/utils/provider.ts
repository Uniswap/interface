/**
 * The goal of the override logic is to asynchronously update window.ethereum to reflect the user's preference, if they decide not to set our wallet as the default.
 *
 * Important context:
 *
 * ethereum.ts injects the provider and is scoped to the main execution world
 *    - it has access to the window events but not the extension chrome storage queries
 * injected.ts facilitates dapp <> extension interactions and is scoped to the isolated extension execution world
 *    - it has access to both window events and chrome storage queries, but it doesn't inject the 1193 provider into window
 *    - it is ran before ethereum.ts due to the ordering in manifest.json
 *
 * Due to these constraints, we need to use injected.ts to query the extension's local storage for the user's default wallet preference, and fire an event with the value that ethereum.ts can access.
 *
 * Here is the happy path flow:
 *
 * 1. User sets default wallet preference
 * 2. Extension local storage tracks user's preference
 * 3. User opens a dapp
 * 4. injected.ts completes; it adds a one-time listener for a provider config (ie default wallet preference) request
 * 5. ethereum.ts adds a listener for the dapp provider config response, then fires an event requesting the config from injected.js
 * 6. we will optimistically inject as the default in the meantime
 * 7. after receiving a response, we handle accordingly:
 *
 * +----------------------------+-----------------------------------------+-----------------------------------------------+
 * | Is Uniswap Default Wallet? | Provider slot occupied by other wallet? |                   Behavior                    |
 * +----------------------------+-----------------------------------------+-----------------------------------------------+
 * | Yes                        | Yes                                     | We override + spoof `isMetaMask`              |
 * | Yes                        | No                                      | We override + spoof `isMetaMask`              |
 * | No                         | Yes                                     | We do nothing (ie leave their provider alone) |
 * | No                         | No                                      | We override w/o spoof                         |
 * +----------------------------+-----------------------------------------+-----------------------------------------------+
 */

const IS_DEFAULT_PROVIDER_KEY = 'is_default_provider'
const DEFAULT_VALUE = true

export async function setIsDefaultProviderToStorage(isDefault: boolean): Promise<void> {
  await chrome.storage.local.set({ [IS_DEFAULT_PROVIDER_KEY]: isDefault })
}

export async function getIsDefaultProviderFromStorage(): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const isDefaultProvider = (await chrome.storage.local.get(IS_DEFAULT_PROVIDER_KEY))?.[IS_DEFAULT_PROVIDER_KEY]

  if (isDefaultProvider !== undefined) {
    const value = JSON.parse(isDefaultProvider)

    if (typeof value === 'boolean') {
      return value
    }
  }

  return DEFAULT_VALUE
}
