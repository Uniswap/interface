import { useApolloClient } from '@apollo/client'
import React, { useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { Action } from 'redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { setCustomEndpoint } from 'src/features/tweaks/slice'
import { Accordion, DeprecatedButton, Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { AccordionHeader, GatingOverrides } from 'wallet/src/components/gating/GatingOverrides'

export function ExperimentsModal(): JSX.Element {
  const insets = useAppInsets()
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
    <Modal
      fullScreen
      renderBehindBottomInset
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          paddingRight: spacing.spacing24,
          paddingLeft: spacing.spacing24,
        }}
      >
        <Text variant="heading3">Server</Text>
        <Accordion collapsible type="single">
          <Accordion.Item value="graphql-endpoint">
            <AccordionHeader title="⚙️ Custom GraphQL Endpoint" />

            <Accordion.Content>
              <Text variant="body2">
                You will need to restart the application to pick up any changes in this section. Beware of client side
                caching!
              </Text>

              <Flex row alignItems="center" gap="$spacing16">
                <Text variant="body2">URL</Text>
                <TextInput flex={1} value={url} onChangeText={setUrl} />
              </Flex>

              <Flex row alignItems="center" gap="$spacing16">
                <Text variant="body2">Key</Text>
                <TextInput flex={1} value={key} onChangeText={setKey} />
              </Flex>

              <Flex grow row alignItems="center" gap="$spacing16">
                <DeprecatedButton flex={1} size="small" onPress={setEndpoint}>
                  Set
                </DeprecatedButton>

                <DeprecatedButton flex={1} size="small" onPress={clearEndpoint}>
                  Clear
                </DeprecatedButton>
              </Flex>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="apollo-cache">
            <AccordionHeader title="🚀 Apollo Cache" />

            <Accordion.Content>
              <DeprecatedButton flex={1} size="small" onPress={async (): Promise<unknown> => await apollo.resetStore()}>
                Reset Cache
              </DeprecatedButton>
            </Accordion.Content>
          </Accordion.Item>

          <GatingOverrides />
        </Accordion>
      </ScrollView>
    </Modal>
  )
}
