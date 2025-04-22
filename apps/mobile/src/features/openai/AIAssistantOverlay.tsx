import { useContext } from 'react'
import { OpenAIContext } from 'src/features/openai/OpenAIContext'
import { Flex } from 'ui/src'
import { CommentDots } from 'ui/src/components/icons'

export function AIAssistantOverlay(): JSX.Element {
  const { open } = useContext(OpenAIContext)

  return (
    <>
      <Flex position="absolute" right={62} top={66} zIndex="$popover" onPress={open}>
        <CommentDots color="$accent1" size="$icon.28" />
      </Flex>
    </>
  )
}
