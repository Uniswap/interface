// Below helpers copy/pasted from https://github.com/DataDog/dd-sdk-reactnative/blob/75a7d291ebe477a58e9d1239883b2b6b45d4117d/packages/react-native-apollo-client/src/helpers.ts

import { Operation } from '@apollo/client'
import { DefinitionNode, OperationDefinitionNode } from 'graphql'

export const getOperationName = (operation: Operation): string | null => {
  if (operation.operationName) {
    return operation.operationName
  }
  return null
}

const getOperationDefinitionNode = (definition: DefinitionNode): definition is OperationDefinitionNode => {
  return definition.kind === 'OperationDefinition' && !!definition.operation
}

export const getOperationType = (operation: Operation): 'query' | 'mutation' | 'subscription' | null => {
  try {
    return (
      operation.query.definitions.filter(getOperationDefinitionNode).map((operationDefinitionNode) => {
        return operationDefinitionNode.operation
      })[0] || null
    )
  } catch (_e) {
    return null
  }
}
