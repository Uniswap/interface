import graphql from 'babel-plugin-relay/macro'

export const tokenPriceFragment = graphql`
  fragment TokenPrice on Query @refetchable(queryName: "TokenPriceQuery") {
    tokens(contracts: [$contract]) {
      market(currency: USD) {
        price {
          value @required(action: LOG)
        }
        priceHistory(duration: $duration) {
          timestamp @required(action: LOG)
          value @required(action: LOG)
        }
      }
    }
  }
`
export type PricePoint = { timestamp: number; value: number }

export function isPricePoint(p: PricePoint | null): p is PricePoint {
  return p !== null
}

// export function useLoadTokenPriceQuery(contract: ContractInput, timePeriod: TimePeriod) {
//   const duration = toHistoryDuration(timePeriod)
//   const environment = useRelayEnvironment()

//   const loadTokenPriceQuery = useCallback(
//     () => loadQuery<TokenPriceQuery>(environment, tokenPriceQuery, { contract, duration }),
//     [contract, duration, environment]
//   )
//   const [queryReference, setQueryReference] = useState<PreloadedQuery<TokenPriceQuery>>(() => {
//     return loadTokenPriceQuery()
//   })

//   useEffect(() => {
//     // Re-render once the new line is ready, rather than flash a loading state.
//     startTransition(() => setQueryReference(loadTokenPriceQuery()))
//   }, [contract, duration, loadTokenPriceQuery])

//   useEffect(() => {
//     return () => queryReference && queryReference.dispose()
//   })

//   return queryReference
// }

// export function usePreloadedTokenPriceQuery(queryReference: PreloadedQuery<TokenPriceQuery>): PricePoint[] | undefined {
//   const queryData = usePreloadedQuery<TokenPriceQuery>(tokenPriceQuery, queryReference)

//   // Appends the current price to the end of the priceHistory array
//   const priceHistory = useMemo(() => {
//     const market = queryData.tokens?.[0]?.market
//     const priceHistory = market?.priceHistory?.filter(isPricePoint)
//     const currentPrice = market?.price?.value
//     if (Array.isArray(priceHistory) && currentPrice !== undefined) {
//       const timestamp = Date.now() / 1000
//       return [...priceHistory, { timestamp, value: currentPrice }]
//     }
//     return priceHistory
//   }, [queryData])

//   return priceHistory
// }
