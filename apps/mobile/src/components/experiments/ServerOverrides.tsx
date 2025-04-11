import { useApolloClient } from '@apollo/client'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { setCustomEndpoint } from 'src/features/tweaks/slice'
import { Accordion, Flex, Text } from 'ui/src'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { AccordionHeader } from 'uniswap/src/components/gating/GatingOverrides'
import { TextInput } from 'uniswap/src/components/input/TextInput'

export function ServerOverrides(): JSX.Element {
  const dispatch = useDispatch()
  const customEndpoint = useSelector(selectCustomEndpoint)

  const apollo = useApolloClient()

  const [url, setUrl] = useState<string>(customEndpoint?.url || '')
  const [key, setKey] = useState<string>(customEndpoint?.key || '')

  const clearEndpoint = (): void => {
    dispatch(setCustomEndpoint({}))
    setUrl('')
    setKey('')
  }

  const setEndpoint = (): void => {
    if (url && key) {
      dispatch(
        setCustomEndpoint({
          customEndpoint: { url, key },
        }),
      )
    } else {
      clearEndpoint()
    }
  }

  return (
    <>
      <Text variant="heading3">Server</Text>
      <Flex flexDirection="column">
        <Accordion.Item value="graphql-endpoint">
          <AccordionHeader title="⚙️ Custom GraphQL Endpoint" />

          <Accordion.Content>
            <Flex flexDirection="column" gap="$spacing16">
              <Text variant="body2">
                You will need to restart the application to pick up any changes in this section. Beware of client side
                caching!
              </Text>

              <Flex flexDirection="column" gap="$spacing16">
                <Flex row alignItems="center" gap="$spacing16">
                  <Text variant="body2">URL</Text>
                  <TextInput backgroundColor="$surface3" flex={1} value={url} onChangeText={setUrl} />
                </Flex>

                <Flex row alignItems="center" gap="$spacing16">
                  <Text variant="body2">Key</Text>
                  <TextInput backgroundColor="$surface3" flex={1} value={key} onChangeText={setKey} />
                </Flex>
              </Flex>

              <Flex grow row alignItems="center" gap="$spacing16">
                <GatingButton onPress={clearEndpoint}>Clear</GatingButton>
                <GatingButton variant="branded" onPress={setEndpoint}>
                  Set
                </GatingButton>
              </Flex>
            </Flex>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="apollo-cache">
          <AccordionHeader title="🚀 Apollo Cache" />

          <Accordion.Content>
            <GatingButton onPress={async (): Promise<unknown> => await apollo.resetStore()}>Reset Cache</GatingButton>
          </Accordion.Content>
        </Accordion.Item>
      </Flex>
    </>
  )
}
