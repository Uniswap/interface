import { BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { DocumentNode } from 'graphql'
import { ClientError, request } from 'graphql-request'

export const UNISWAP_V3_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-alt'

// wrapper around graphql-request to interface with rtk-query
export const graphqlBaseQuery =
  ({
    baseUrl,
  }: {
    baseUrl: string
  }): BaseQueryFn<{ document: string | DocumentNode; variables?: any }, unknown, ClientError> =>
  async ({ document, variables }) => {
    try {
      return { data: await request(baseUrl, document, variables) }
    } catch (error) {
      if (error instanceof ClientError) {
        return { error }
      }
      throw error
    }
  }
