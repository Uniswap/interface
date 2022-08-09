import { graphql, usePreloadedQuery } from 'react-relay'

const artistsQuery = graphql`
  query ArtistQuery($artistID: String!) {
    artist(id: $artistID) {
      name
      ...ArtistDescription_artist
    }
  }
`

// function useAllV3TicksQuery(poolAddress: string, skip: number) {
//   const data = usePreloadedQuery(artistsQuery, artistsQueryReference)
// }
