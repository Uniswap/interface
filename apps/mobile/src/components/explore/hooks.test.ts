import { GraphQLApi } from '@universe/api'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import configureMockStore from 'redux-mock-store'
import { thunk } from 'redux-thunk'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { renderHookWithProviders } from 'src/test/render'
import { AssetType } from 'uniswap/src/entities/assets'
import { FavoritesState } from 'uniswap/src/features/favorites/slice'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { CurrencyField } from 'uniswap/src/types/currency'
import { cleanup } from 'wallet/src/test/test-utils'

jest.mock('src/app/navigation/rootNavigation', () => ({
  navigate: jest.fn(),
}))

const mockNavigate = navigate as jest.MockedFunction<typeof navigate>

const tokenId = SAMPLE_SEED_ADDRESS_1
const currencyId = `1-${tokenId}`

const resolvers: GraphQLApi.Resolvers = {
  Token: {
    id: () => tokenId,
  },
}

const mockStore = configureMockStore([thunk])

describe(useExploreTokenContextMenu, () => {
  const tokenMenuParams = {
    currencyId,
    chainId: 1,
    analyticsSection: SectionName.CurrencyInputPanel,
  }

  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('editing favorite tokens', () => {
    it('renders proper context menu items when onEditFavorites is not provided', async () => {
      const { result } = renderHookWithProviders(() => useExploreTokenContextMenu(tokenMenuParams), { resolvers })

      expect(result.current.menuActions).toEqual([
        expect.objectContaining({
          title: 'Favorite token',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Swap',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Receive',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Share',
          onPress: expect.any(Function),
        }),
      ])
      cleanup()
    })

    it('renders proper context menu items when onEditFavorites is provided', async () => {
      const onEditFavorites = jest.fn()
      const { result } = renderHookWithProviders(
        () => useExploreTokenContextMenu({ ...tokenMenuParams, onEditFavorites }),
        { resolvers },
      )

      expect(result.current.menuActions).toEqual([
        expect.objectContaining({
          title: 'Favorite token',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Edit favorites',
          onPress: onEditFavorites,
        }),
        expect.objectContaining({
          title: 'Swap',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Receive',
          onPress: expect.any(Function),
        }),
      ])
      cleanup()
    })

    it('calls onEditFavorites when edit favorites is pressed', async () => {
      const onEditFavorites = jest.fn()
      const { result } = renderHookWithProviders(
        () => useExploreTokenContextMenu({ ...tokenMenuParams, onEditFavorites }),
        { resolvers },
      )

      const editFavoritesActionIndex = result.current.menuActions.findIndex(
        (action: ContextMenuAction) => action.title === 'Edit favorites',
      )
      result.current.onContextMenuPress({
        nativeEvent: { index: editFavoritesActionIndex },
      } as NativeSyntheticEvent<ContextMenuOnPressNativeEvent>)

      expect(onEditFavorites).toHaveBeenCalledTimes(1)
      cleanup()
    })
  })

  describe('adding / removing favorite tokens', () => {
    it('renders proper context menu items when token is favorited', async () => {
      const { result } = renderHookWithProviders(() => useExploreTokenContextMenu(tokenMenuParams), {
        preloadedState: {
          favorites: { tokens: [tokenMenuParams.currencyId.toLowerCase()] } as FavoritesState,
        },
        resolvers,
      })

      expect(result.current.menuActions).toEqual([
        expect.objectContaining({
          title: 'Remove favorite',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Swap',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Receive',
          onPress: expect.any(Function),
        }),
        expect.objectContaining({
          title: 'Share',
          onPress: expect.any(Function),
        }),
      ])
      cleanup()
    })

    it("dispatches add to favorites redux action when 'Favorite token' is pressed", async () => {
      const store = mockStore({ favorites: { tokens: [] }, appearance: { theme: 'system' }, userSettings: {} })
      const { result } = renderHookWithProviders(() => useExploreTokenContextMenu(tokenMenuParams), {
        resolvers,
        store,
      })

      const favoriteTokenActionIndex = result.current.menuActions.findIndex(
        (action: ContextMenuAction) => action.title === 'Favorite token',
      )
      result.current.onContextMenuPress({
        nativeEvent: { index: favoriteTokenActionIndex },
      } as NativeSyntheticEvent<ContextMenuOnPressNativeEvent>)

      const dispatchedActions = store.getActions()
      expect(dispatchedActions).toContainEqual({
        type: 'favorites/addFavoriteToken',
        payload: { currencyId: tokenMenuParams.currencyId.toLowerCase() },
      })
      cleanup()
    })

    it("dispatches remove from favorites redux action when 'Remove favorite' is pressed", async () => {
      const store = mockStore({
        favorites: { tokens: [tokenMenuParams.currencyId.toLowerCase()] },
        appearance: { theme: 'system' },
        userSettings: {},
      })
      const { result } = renderHookWithProviders(() => useExploreTokenContextMenu(tokenMenuParams), {
        resolvers,
        store,
      })

      const removeFavoriteTokenActionIndex = result.current.menuActions.findIndex(
        (action: ContextMenuAction) => action.title === 'Remove favorite',
      )
      result.current.onContextMenuPress({
        nativeEvent: { index: removeFavoriteTokenActionIndex },
      } as NativeSyntheticEvent<ContextMenuOnPressNativeEvent>)

      const dispatchedActions = store.getActions()
      expect(dispatchedActions).toContainEqual({
        type: 'favorites/removeFavoriteToken',
        payload: { currencyId: tokenMenuParams.currencyId.toLowerCase() },
      })
      cleanup()
    })
  })

  it('calls navigate with correct parameters when swap is pressed', async () => {
    const store = mockStore({
      favorites: { tokens: [] },
      selectedAppearanceSettings: { theme: 'system' },
      userSettings: {},
    })
    const { result } = renderHookWithProviders(() => useExploreTokenContextMenu(tokenMenuParams), {
      store,
      resolvers,
    })

    const swapActionIndex = result.current.menuActions.findIndex((action: ContextMenuAction) => action.title === 'Swap')
    result.current.onContextMenuPress({
      nativeEvent: { index: swapActionIndex },
    } as NativeSyntheticEvent<ContextMenuOnPressNativeEvent>)

    expect(mockNavigate).toHaveBeenCalledWith(ModalName.Swap, {
      exactAmountToken: '',
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        chainId: 1,
        address: tokenId,
        type: AssetType.Currency,
      },
    })
    cleanup()
  })

  it('opens share modal when share is pressed', async () => {
    const { result } = renderHookWithProviders(() => useExploreTokenContextMenu(tokenMenuParams), {
      resolvers,
    })

    jest.spyOn(Share, 'share')

    const shareActionIndex = result.current.menuActions.findIndex(
      (action: ContextMenuAction) => action.title === 'Share',
    )
    result.current.onContextMenuPress({
      nativeEvent: { index: shareActionIndex },
    } as NativeSyntheticEvent<ContextMenuOnPressNativeEvent>)

    expect(Share.share).toHaveBeenCalledTimes(1)
    cleanup()
  })
})
