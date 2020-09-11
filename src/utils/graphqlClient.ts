import { GraphQLClient } from 'graphql-request'

const endpoint = process.env.THE_GRAPH_URL || ''
const graphQLClient = new GraphQLClient(endpoint)
export default graphQLClient
