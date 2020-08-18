import { createStore, Store } from 'redux'
import { fetchTokenList, acceptListUpdate, addList, removeList, selectList } from './actions'
import reducer, { ListsState } from './reducer'

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

describe('list reducer', () => {
  let store: Store<ListsState>

  beforeEach(() => {
    store = createStore(reducer, {
      byUrl: {},
      selectedListUrl: undefined
    })
  })

  describe('fetchTokenList', () => {
    describe('pending', () => {
      it('sets pending', () => {
        store.dispatch(fetchTokenList.pending({ requestId: 'request-id', url: 'fake-url' }))
        expect(store.getState()).toEqual({
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

      it('does not clear current list', () => {
        store = createStore(reducer, {
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

        store.dispatch(fetchTokenList.pending({ requestId: 'request-id', url: 'fake-url' }))
        expect(store.getState()).toEqual({
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

    describe('fulfilled', () => {
      it('saves the list', () => {
        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url' })
        )
        expect(store.getState()).toEqual({
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

      it('does not save the list in pending if current is same', () => {
        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url' })
        )
        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url' })
        )
        expect(store.getState()).toEqual({
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

      it('does not save to current if list is newer patch version', () => {
        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url' })
        )

        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: PATCHED_STUB_LIST, requestId: 'request-id', url: 'fake-url' })
        )
        expect(store.getState()).toEqual({
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
      it('does not save to current if list is newer minor version', () => {
        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url' })
        )

        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: MINOR_UPDATED_STUB_LIST, requestId: 'request-id', url: 'fake-url' })
        )
        expect(store.getState()).toEqual({
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
      it('does not save to pending if list is newer major version', () => {
        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: STUB_TOKEN_LIST, requestId: 'request-id', url: 'fake-url' })
        )

        store.dispatch(
          fetchTokenList.fulfilled({ tokenList: MAJOR_UPDATED_STUB_LIST, requestId: 'request-id', url: 'fake-url' })
        )
        expect(store.getState()).toEqual({
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

    describe('rejected', () => {
      it('no-op if not loading', () => {
        store.dispatch(fetchTokenList.rejected({ requestId: 'request-id', errorMessage: 'abcd', url: 'fake-url' }))
        expect(store.getState()).toEqual({
          byUrl: {},
          selectedListUrl: undefined
        })
      })

      it('sets the error if loading', () => {
        store = createStore(reducer, {
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
        store.dispatch(fetchTokenList.rejected({ requestId: 'request-id', errorMessage: 'abcd', url: 'fake-url' }))
        expect(store.getState()).toEqual({
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

  describe('addList', () => {
    it('adds the list key to byUrl', () => {
      store.dispatch(addList('list-id'))
      expect(store.getState()).toEqual({
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
    it('no op for existing list', () => {
      store = createStore(reducer, {
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
      store.dispatch(addList('fake-url'))
      expect(store.getState()).toEqual({
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

  describe('acceptListUpdate', () => {
    it('swaps pending update into current', () => {
      store = createStore(reducer, {
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
      store.dispatch(acceptListUpdate('fake-url'))
      expect(store.getState()).toEqual({
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

  describe('removeList', () => {
    it('deletes the list key', () => {
      store = createStore(reducer, {
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
      store.dispatch(removeList('fake-url'))
      expect(store.getState()).toEqual({
        byUrl: {},
        selectedListUrl: undefined
      })
    })
    it('unselects the list if selected', () => {
      store = createStore(reducer, {
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
      store.dispatch(removeList('fake-url'))
      expect(store.getState()).toEqual({
        byUrl: {},
        selectedListUrl: undefined
      })
    })
  })

  describe('selectList', () => {
    it('sets the selected list url', () => {
      store = createStore(reducer, {
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
      store.dispatch(selectList('fake-url'))
      expect(store.getState()).toEqual({
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
    it('selects if not present already', () => {
      store = createStore(reducer, {
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
      store.dispatch(selectList('fake-url-invalid'))
      expect(store.getState()).toEqual({
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
    it('works if list already added', () => {
      store = createStore(reducer, {
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
      store.dispatch(selectList('fake-url'))
      expect(store.getState()).toEqual({
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
