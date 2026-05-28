import { ApolloLink } from '@apollo/client'
import {
  DATADOG_GRAPH_QL_OPERATION_NAME_HEADER,
  DATADOG_GRAPH_QL_OPERATION_TYPE_HEADER,
} from '@datadog/mobile-react-native'
import { getOperationName, getOperationType } from 'utilities/src/logger/datadog/datadogLinkUtils'

export const getDatadogApolloLink = (): ApolloLink => {
  return new DatadogLink()
}
/**
 * Based on https://github.com/DataDog/dd-sdk-reactnative/blob/75a7d291ebe477a58e9d1239883b2b6b45d4117d/packages/react-native-apollo-client/src/DatadogLink.ts
 *
 * Some of our graphql requests were failing because the headers were too large.
 * To fix this, we copy/pasted the DatadogLink and removed the graphql variables header.
 *
 * We're still confused about why DD needs to inject this data in the header of every request,
 * so ideally we could find a better way of adding this data to RUM to avoid increasing our network requests size.
 */
class DatadogLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const operationName = getOperationName(operation)
      const operationType = getOperationType(operation)

      operation.setContext(({ headers = {} }) => {
        const newHeaders: Record<string, string | null> = {
          ...headers,
        }

        newHeaders[DATADOG_GRAPH_QL_OPERATION_TYPE_HEADER] = operationType
        newHeaders[DATADOG_GRAPH_QL_OPERATION_NAME_HEADER] = operationName

        return {
          headers: newHeaders,
        }
      })

      return forward(operation)
    })
  }
}
