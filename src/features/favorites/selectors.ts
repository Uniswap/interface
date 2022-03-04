import { RootState } from 'src/app/rootReducer'

export const selectFavoriteTokens = (state: RootState) => state.favorites.tokens
