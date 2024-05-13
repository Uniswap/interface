import { useApolloClient } from '@apollo/client'
import React, { useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectCustomEndpoint } from 'src/features/tweaks/selectors'
import { setCustomEndpoint } from 'src/features/tweaks/slice'
import { Accordion, Button, Flex, Text, useDeviceInsets } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { AccordionHeader, GatingOverrides } from 'wallet/src/components/gating/GatingOverrides'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ModalName } from 'wallet/src/telemetry/constants'

export function ExperimentsModal(): JSX.Element {
  const insets = useDeviceInsets()
  const dispatch = useAppDispatch()
  const customEndpoint = useAppSelector(selectCustomEndpoint)

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
        })
      )
    } else {
      clearEndpoint()
    }
  }

  return (
    <BottomSheetModal
      fullScreen
      renderBehindBottomInset
      name={ModalName.Experiments}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.Experiments }))}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          paddingRight: spacing.spacing24,
          paddingLeft: spacing.spacing24,
        }}>
        <Accordion type="single">
          <Accordion.Item value="graphql-endpoint">
            <AccordionHeader title="⚙️ Custom GraphQL Endpoint" />

            <Accordion.Content>
              <Text variant="body2">
                You will need to restart the application to pick up any changes in this section.
                Beware of client side caching!
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
                <Button flex={1} size="small" onPress={setEndpoint}>
                  Set
                </Button>

                <Button flex={1} size="small" onPress={clearEndpoint}>
                  Clear
                </Button>
              </Flex>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="apollo-cache">
            <AccordionHeader title="🚀 Apollo Cache" />

            <Accordion.Content>
              <Button
                flex={1}
                size="small"
                onPress={async (): Promise<unknown> => await apollo.resetStore()}>
                Reset Cache
              </Button>
            </Accordion.Content>
          </Accordion.Item>

          <GatingOverrides />
        </Accordion>
      </ScrollView>
    </BottomSheetModal>
  )
}
