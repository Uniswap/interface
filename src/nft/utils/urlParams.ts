import { CollectionFilters, initialCollectionFilterState, SortByPointers, Trait } from 'nft/hooks'
import { GenieCollection } from 'nft/types'
import qs from 'query-string'
import { Location } from 'react-router-dom'

const trimTraitStr = (trait: string) => {
  return trait.substring(1, trait.length - 1)
}

const urlParamsUtils = {
  removeDefaults: (query: Record<string, any>) => {
    const clonedQuery: Record<string, any> = { ...query }

    // Leveraging default values & not showing them on URL
    for (const key in clonedQuery) {
      const valueInQuery = clonedQuery[key]
      const initialValue = initialCollectionFilterState[key as keyof typeof initialCollectionFilterState]

      if (JSON.stringify(valueInQuery) === JSON.stringify(initialValue)) {
        delete clonedQuery[key]
      }
    }

    // Doing this one manually due to name mismatch - "all" in url, "buyNow" in state
    if (clonedQuery['all'] !== initialCollectionFilterState.buyNow) {
      delete clonedQuery['all']
    }

    const defaultSortByPointer = SortByPointers[initialCollectionFilterState.sortBy]
    if (clonedQuery['sort'] === defaultSortByPointer) {
      delete clonedQuery['sort']
    }

    return clonedQuery
  },

  // Making values in our URL more state-friendly
  buildQuery: (query: Record<string, any>, collectionStats: GenieCollection) => {
    const clonedQuery: Record<string, any> = { ...query }
    const filters = ['traits', 'markets']

    filters.forEach((key) => {
      if (!clonedQuery[key]) {
        clonedQuery[key] = []
      }

      /* 
        query-string package treats arrays with one value as a string.
        Here we're making sure that we have an array, not a string. Example:
          const foo = 'hey' // => ['hey']
      */
      if (clonedQuery[key] && typeof clonedQuery[key] === 'string') {
        clonedQuery[key] = [clonedQuery[key]]
      }
    })

    try {
      const { buyNow: initialBuyNow, search: initialSearchText } = initialCollectionFilterState

      Object.entries(SortByPointers).forEach(([key, value]) => {
        if (value === clonedQuery['sort']) {
          clonedQuery['sortBy'] = Number(key)
        }
      })

      clonedQuery['buyNow'] = !(clonedQuery['all'] === undefined ? !initialBuyNow : clonedQuery['all'])
      clonedQuery['search'] = clonedQuery['search'] === undefined ? initialSearchText : String(clonedQuery['search'])

      /*
        Handling an edge case caused by query-string's bad array parsing, when user
        only selects one trait and reloads the page.
        Here's the general data-structure for our traits in URL: 
          `traits=("trait_type","trait_value"),("trait_type","trait_value")`

        Expected behavior: When user selects one trait, there should be an array
        containing one element.

        Actual behavior: It creates an array with two elements, first element being
        trait_type & the other trait_value. This causes confusion since we don't know
        whether user has selected two traits (cause we have two elements in our array)
        or it's only one.

        Using this block of code, we'll identify if that's the case.
      */

      if (clonedQuery['traits'].length === 2) {
        const [trait_type, trait_value] = clonedQuery['traits'] as [string, string]
        const fullTrait = `${trait_type}${trait_value}`
        if (!fullTrait.includes(',')) {
          if (
            trait_type.startsWith('(') &&
            !trait_type.endsWith(')') &&
            trait_value.endsWith(')') &&
            !trait_value.startsWith('(')
          )
            clonedQuery['traits'] = [`${trait_type},${trait_value}`]
        }
      }

      clonedQuery['traits'] = clonedQuery['traits'].map((queryTrait: string) => {
        const modifiedTrait = trimTraitStr(queryTrait.replace(/(")/g, ''))
        const [trait_type, trait_value] = modifiedTrait.split(',')
        const traitInStats =
          collectionStats.traits &&
          collectionStats.traits[trait_type].find((trait) => trait.trait_value === trait_value)

        /*
          For most cases, `traitInStats` is assigned. In case the trait
          does not exist in our store, e.g "Number of traits", we have to
          manually create an object for it.
        */
        const trait = traitInStats ?? { trait_type, trait_value, trait_count: 0 }

        return trait as Trait
      })
    } catch (err) {
      clonedQuery['traits'] = []
    }

    return clonedQuery
  },
}

export const syncLocalFiltersWithURL = (state: CollectionFilters) => {
  const urlFilterItems = [
    'markets',
    'maxPrice',
    'maxRarity',
    'minPrice',
    'minRarity',
    'traits',
    'all',
    'search',
    'sort',
  ] as const

  const query: Record<string, any> = {}
  urlFilterItems.forEach((key) => {
    switch (key) {
      case 'traits': {
        const traits = state.traits.map(({ trait_type, trait_value }) => `("${trait_type}","${trait_value}")`)
        query['traits'] = traits
        break
      }
      case 'all':
        query['all'] = !state.buyNow
        break

      case 'sort':
        query['sort'] = SortByPointers[state.sortBy]
        break

      default:
        query[key] = state[key]
        break
    }
  })

  const modifiedQuery = urlParamsUtils.removeDefaults(query)

  // Applying local state changes to URL
  const url = window.location.href.split('?')[0]
  const stringifiedQuery = qs.stringify(modifiedQuery, { arrayFormat: 'comma' })

  // Using window.history directly on purpose here. router.push() will trigger re-renders & API calls.
  window.history.replaceState({}, ``, `${url}${stringifiedQuery && `?${stringifiedQuery}`}`)
}

export const applyFiltersFromURL = (location: Location, collectionStats: GenieCollection) => {
  if (!location.search) return

  const query = qs.parse(location.search, {
    arrayFormat: 'comma',
    parseNumbers: true,
    parseBooleans: true,
  }) as {
    maxPrice: string
    maxRarity: string
    minPrice: string
    minRarity: string
    search: string
    sort: string
    sortBy: number
    all: boolean
    buyNow: boolean
    traits: string[]
    markets: string[]
  }
  const modifiedQuery = urlParamsUtils.buildQuery(query, collectionStats)

  return modifiedQuery
}
