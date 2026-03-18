import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { Accordion, Flex } from 'ui/src'
import { GatingButton } from 'uniswap/src/components/gating/GatingButton'
import { AccordionHeader } from 'uniswap/src/components/gating/GatingOverrides'

export function CacheConfig(): JSX.Element {
  const apollo = useApolloClient()
  const queryClient = useQueryClient()

  return (
    <Flex>
      <Accordion.Item value="cache-config">
        <AccordionHeader title="🚀 Apollo & React Query Cache" />

        <Accordion.Content>
          <Flex gap="$spacing12">
            <GatingButton onPress={async (): Promise<unknown> => await apollo.resetStore()}>
              Reset Apollo Cache
            </GatingButton>

            <GatingButton onPress={(): void => queryClient.clear()}>Reset React Query Cache</GatingButton>
          </Flex>
        </Accordion.Content>
      </Accordion.Item>
    </Flex>
  )
}
