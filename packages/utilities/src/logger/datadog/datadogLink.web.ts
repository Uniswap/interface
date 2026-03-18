import { ApolloLink } from '@apollo/client'
import { datadogRum } from '@datadog/browser-rum'
import { getOperationName, getOperationType } from 'utilities/src/logger/datadog/datadogLinkUtils'

const DATADOG_CUSTOM_HEADER_PREFIX = '_dd-custom-header'
const DATADOG_GRAPH_QL_OPERATION_NAME_HEADER = `${DATADOG_CUSTOM_HEADER_PREFIX}-graph-ql-operation-name`
const DATADOG_GRAPH_QL_OPERATION_TYPE_HEADER = `${DATADOG_CUSTOM_HEADER_PREFIX}-graph-ql-operation-type`

export const getDatadogApolloLink = (): ApolloLink => {
  return new DatadogLink()
}

/**
 * Web implementation of DatadogLink for Apollo Client that adds operation tracking headers
 * and integrates with browser RUM.
 */
class DatadogLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const operationName = getOperationName(operation)
      const operationType = getOperationType(operation)

      // Add operation tracking headers
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

      // Track the operation in Datadog RUM
      datadogRum.addAction('graphql_operation', {
        operationType,
        operationName,
      })

      return forward(operation)
    })
  }
}
