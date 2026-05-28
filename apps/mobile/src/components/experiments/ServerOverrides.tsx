import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { setCustomEndpoint } from 'src/features/tweaks/slice'
import { Accordion, Flex, Text } from 'ui/src'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { AccordionHeader } from 'uniswap/src/components/gating/GatingOverrides'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'

export function ServerOverrides(): JSX.Element {
  const dispatch = useDispatch()
  const customEndpoint = useSelector(selectCustomEndpoint)

  const [url, setUrl] = useState<string>(customEndpoint?.url || '')
  const [key, setKey] = useState<string>(customEndpoint?.key || '')

  const clearEndpoint = (): void => {
    dispatch(setCustomEndpoint({}))
    setUrl('')
    setKey('')
    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: 'Custom endpoint cleared',
        hideDelay: 3000,
      }),
    )
  }

  const setEndpoint = (): void => {
    if (url && key) {
      dispatch(
        setCustomEndpoint({
          customEndpoint: { url, key },
        }),
      )
      dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: `Custom endpoint configured successfully (${url})`,
          hideDelay: 3000,
        }),
      )
    } else {
      clearEndpoint()
    }
  }

  return (
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
    </Flex>
  )
}
