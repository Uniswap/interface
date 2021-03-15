import { createStore, Store } from 'redux'
import {
  BRIDGE_DEFAULT_LIST_OF_LISTS,
  BRIDGE_DEFAULT_TOKEN_LIST_URL,
  SWAP_DEFAULT_LIST_OF_LISTS,
  SWAP_DEFAULT_TOKEN_LIST_URL
} from '../../constants/lists'
import { updateVersion } from '../global/actions'
import { fetchTokenList, acceptListUpdate, addList, removeList, selectList } from './actions'
import reducer, { ListsState } from './reducer'
import BRIDGE_DEFAULT_TOKEN_LIST from '../../constants/qa/tokenlist.json'
import SWAP_DEFAULT_TOKEN_LIST from '@fuseswap/default-token-list'

const STUB_TOKEN_LIST = {
  name: '',
  timestamp: '',
  version: { major: 1, minor: 1, patch: 1 },
  tokens: []
}

const PATCHED_STUB_LIST = {
  ...STUB_TOKEN_LIST,
  version: { ...STUB_TOKEN_LIST.version, patch: STUB_TOKEN_LIST.version.patch + 1 }
}
const MINOR_UPDATED_STUB_LIST = {
  ...STUB_TOKEN_LIST,
  version: { ...STUB_TOKEN_LIST.version, minor: STUB_TOKEN_LIST.version.minor + 1 }
}
const MAJOR_UPDATED_STUB_LIST = {
  ...STUB_TOKEN_LIST,
  version: { ...STUB_TOKEN_LIST.version, major: STUB_TOKEN_LIST.version.major + 1 }
}
const LIST_TYPES: CurrencyListType[] = ['Bridge', 'Swap']

function createInitialState(state: any) {
  return LIST_TYPES.reduce((obj: any, listType) => {
    obj[listType] = state
    return obj
  }, {})
}

describe('list reducer', () => {
  let store: Store<ListsState>

  beforeEach(() => {
    store = createStore(
      reducer,
      createInitialState({
        byUrl: {},
        selectedListUrl: undefined
      })
    )
  })

  describe('fetchTokenList', () => {
    describe('pending', () => {
      it('sets pending', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(fetchTokenList.pending({ requestId: 'request-id', url: 'fake-url', listType }))
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                loadingRequestId: 'request-id',
                current: null,
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        })
      })

      it('does not clear current list', () => {
        store = createStore(
          reducer,
          createInitialState({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                pendingUpdate: null,
                loadingRequestId: null
              }
            },
            selectedListUrl: undefined
          })
        )

        LIST_TYPES.forEach(listType => {
          store.dispatch(fetchTokenList.pending({ requestId: 'request-id', url: 'fake-url', listType }))
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: 'request-id',
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        })
      })
    })

    describe('fulfilled', () => {
      it('saves the list', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url', listType })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        })
      })

      it('does not save the list in pending if current is same', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url', listType })
          )
          store.dispatch(
            fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url', listType })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        })
      })

      it('does not save to current if list is newer patch version', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url', listType })
          )

          store.dispatch(
            fetchTokenList.fulfilled({
              tokenList: PATCHED_STUB_LIST,
              requestId: 'request-id',
              url: 'fake-url',
              listType
            })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: PATCHED_STUB_LIST
              }
            },
            selectedListUrl: undefined
          })
        })
      })
      it('does not save to current if list is newer minor version', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url', listType })
          )

          store.dispatch(
            fetchTokenList.fulfilled({
              tokenList: MINOR_UPDATED_STUB_LIST,
              requestId: 'request-id',
              url: 'fake-url',
              listType
            })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: MINOR_UPDATED_STUB_LIST
              }
            },
            selectedListUrl: undefined
          })
        })
      })
      it('does not save to pending if list is newer major version', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url', listType })
          )

          store.dispatch(
            fetchTokenList.fulfilled({
              tokenList: MAJOR_UPDATED_STUB_LIST,
              requestId: 'request-id',
              url: 'fake-url',
              listType
            })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: MAJOR_UPDATED_STUB_LIST
              }
            },
            selectedListUrl: undefined
          })
        })
      })
    })

    describe('rejected', () => {
      it('no-op if not loading', () => {
        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.rejected({ requestId: 'request-id', errorMessage: 'abcd', url: 'fake-url', listType })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {},
            selectedListUrl: undefined
          })
        })
      })

      it('sets the error if loading', () => {
        store = createStore(
          reducer,
          createInitialState({
            byUrl: {
              'fake-url': {
                error: null,
                current: null,
                loadingRequestId: 'request-id',
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        )

        LIST_TYPES.forEach(listType => {
          store.dispatch(
            fetchTokenList.rejected({ requestId: 'request-id', errorMessage: 'abcd', url: 'fake-url', listType })
          )
          expect(store.getState()[listType]).toEqual({
            byUrl: {
              'fake-url': {
                error: 'abcd',
                current: null,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        })
      })
    })
  })

  describe('addList', () => {
    it('adds the list key to byUrl', () => {
      LIST_TYPES.forEach(listType => {
        store.dispatch(addList({ url: 'list-id', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {
            'list-id': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: undefined
        })
      })
    })
    it('no op for existing list', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: undefined
        })
      )

      LIST_TYPES.forEach(listType => {
        store.dispatch(addList({ url: 'fake-url', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: undefined
        })
      })
    })
  })

  describe('acceptListUpdate', () => {
    it('swaps pending update into current', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          selectedListUrl: undefined
        })
      )

      LIST_TYPES.forEach(listType => {
        store.dispatch(acceptListUpdate({ url: 'fake-url', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {
            'fake-url': {
              error: null,
              current: PATCHED_STUB_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: undefined
        })
      })
    })
  })

  describe('removeList', () => {
    it('deletes the list key', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          selectedListUrl: undefined
        })
      )

      LIST_TYPES.forEach(listType => {
        store.dispatch(removeList({ url: 'fake-url', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {},
          selectedListUrl: undefined
        })
      })
    })
    it('unselects the list if selected', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          selectedListUrl: 'fake-url'
        })
      )
      LIST_TYPES.forEach(listType => {
        store.dispatch(removeList({ url: 'fake-url', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {},
          selectedListUrl: undefined
        })
      })
    })
  })

  describe('selectList', () => {
    it('sets the selected list url', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          selectedListUrl: undefined
        })
      )
      LIST_TYPES.forEach(listType => {
        store.dispatch(selectList({ url: 'fake-url', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          selectedListUrl: 'fake-url'
        })
      })
    })
    it('selects if not present already', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          selectedListUrl: undefined
        })
      )
      LIST_TYPES.forEach(listType => {
        store.dispatch(selectList({ url: 'fake-url-invalid', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            },
            'fake-url-invalid': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: 'fake-url-invalid'
        })
      })
    })
    it('works if list already added', () => {
      store = createStore(
        reducer,
        createInitialState({
          byUrl: {
            'fake-url': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: undefined
        })
      )
      LIST_TYPES.forEach(listType => {
        store.dispatch(selectList({ url: 'fake-url', listType }))
        expect(store.getState()[listType]).toEqual({
          byUrl: {
            'fake-url': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: 'fake-url'
        })
      })
    })
  })

  describe('updateVersion', () => {
    describe('never initialized', () => {
      beforeEach(() => {
        store = createStore(
          reducer,
          createInitialState({
            byUrl: {
              'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              },
              'https://unpkg.com/@uniswap/default-token-list@latest': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            selectedListUrl: undefined
          })
        )
        store.dispatch(updateVersion())
      })

      it('clears the current lists', () => {
        LIST_TYPES.forEach(listType => {
          expect(
            store.getState()[listType].byUrl[
              'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json'
            ]
          ).toBeUndefined()
          expect(
            store.getState()[listType].byUrl['https://unpkg.com/@uniswap/default-token-list@latest']
          ).toBeUndefined()
        })
      })

      it('puts in all the new lists', () => {
        LIST_TYPES.forEach(listType => {
          const DEFAULT_LIST_OF_LISTS =
            listType === 'Bridge' ? BRIDGE_DEFAULT_LIST_OF_LISTS : SWAP_DEFAULT_LIST_OF_LISTS
          expect(Object.keys(store.getState()[listType].byUrl)).toEqual(DEFAULT_LIST_OF_LISTS)
        })
      })
      it('all lists are empty', () => {
        LIST_TYPES.forEach(listType => {
          const s = store.getState()[listType]
          let DEFAULT_TOKEN_LIST_URL: string
          let current: any

          if (listType === 'Bridge') {
            DEFAULT_TOKEN_LIST_URL = BRIDGE_DEFAULT_TOKEN_LIST_URL
            current = BRIDGE_DEFAULT_TOKEN_LIST
          } else {
            DEFAULT_TOKEN_LIST_URL = SWAP_DEFAULT_TOKEN_LIST_URL
            current = SWAP_DEFAULT_TOKEN_LIST
          }

          Object.keys(s.byUrl).forEach(url => {
            if (url === DEFAULT_TOKEN_LIST_URL) {
              expect(s.byUrl[url]).toEqual({
                error: null,
                current: current,
                loadingRequestId: null,
                pendingUpdate: null
              })
            } else {
              expect(s.byUrl[url]).toEqual({
                error: null,
                current: null,
                loadingRequestId: null,
                pendingUpdate: null
              })
            }
          })
        })
      })
      it('sets initialized lists', () => {
        LIST_TYPES.forEach(listType => {
          const DEFAULT_LIST_OF_LISTS =
            listType === 'Bridge' ? BRIDGE_DEFAULT_LIST_OF_LISTS : SWAP_DEFAULT_LIST_OF_LISTS
          expect(store.getState()[listType].lastInitializedDefaultListOfLists).toEqual(DEFAULT_LIST_OF_LISTS)
        })
      })
    })
    describe('initialized with a different set of lists', () => {
      beforeEach(() => {
        const state = createInitialState({
          byUrl: {
            'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            },
            'https://unpkg.com/@uniswap/default-token-list@latest': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          selectedListUrl: undefined,
          lastInitializedDefaultListOfLists: ['https://unpkg.com/@uniswap/default-token-list@latest']
        })
        store = createStore(reducer, state)
        store.dispatch(updateVersion())
      })

      it('does not remove lists not in last initialized list of lists', () => {
        LIST_TYPES.forEach(listType => {
          expect(
            store.getState()[listType].byUrl[
              'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json'
            ]
          ).toEqual({
            error: null,
            current: STUB_TOKEN_LIST,
            loadingRequestId: null,
            pendingUpdate: null
          })
        })
      })
      it('removes lists in the last initialized list of lists', () => {
        LIST_TYPES.forEach(listType => {
          expect(
            store.getState()[listType].byUrl['https://unpkg.com/@uniswap/default-token-list@latest']
          ).toBeUndefined()
        })
      })

      it('adds all the lists in the default list of lists', () => {
        LIST_TYPES.forEach(listType => {
          const DEFAULT_TOKEN_LIST_URL =
            listType === 'Bridge' ? BRIDGE_DEFAULT_TOKEN_LIST_URL : SWAP_DEFAULT_TOKEN_LIST_URL
          expect(Object.keys(store.getState()[listType].byUrl)).toContain(DEFAULT_TOKEN_LIST_URL)
        })
      })

      it('each of those initialized lists is empty', () => {
        LIST_TYPES.forEach(listType => {
          const byUrl = store.getState()[listType].byUrl
          // note we don't expect the uniswap default list to be prepopulated
          // this is ok.
          Object.keys(byUrl).forEach(url => {
            if (url !== 'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json') {
              expect(byUrl[url]).toEqual({
                error: null,
                current: null,
                loadingRequestId: null,
                pendingUpdate: null
              })
            }
          })
        })
      })

      it('sets initialized lists', () => {
        LIST_TYPES.forEach(listType => {
          const DEFAULT_LIST_OF_LISTS =
            listType === 'Bridge' ? BRIDGE_DEFAULT_LIST_OF_LISTS : SWAP_DEFAULT_LIST_OF_LISTS
          expect(store.getState()[listType].lastInitializedDefaultListOfLists).toEqual(DEFAULT_LIST_OF_LISTS)
        })
      })
    })
  })
})
