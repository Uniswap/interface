import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense } from 'react'
import { Text, View } from 'react-native'
import { useLazyLoadQuery } from 'react-relay'
import { ExampleQuery } from 'src/data/__generated__/ExampleQuery.graphql'

function ExampleQueryComponent() {
  const data = useLazyLoadQuery<ExampleQuery>(
    graphql`
      query ExampleQuery {
        tokens(first: 500) {
          id
          name
          symbol
        }
      }
    `,
    {}
  )

  return (
    <View>
      {data.tokens.map((token) => (
        <Text key={token.id}>{token.name}</Text>
      ))}
    </View>
  )
}

export function Example() {
  return (
    <Suspense fallback={<Text>Loading</Text>}>
      <ExampleQueryComponent />
    </Suspense>
  )
}
