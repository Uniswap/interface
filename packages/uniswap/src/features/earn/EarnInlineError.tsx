import { Flex, Text } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'

export function EarnInlineError({ message, learnMoreUrl }: { message: string; learnMoreUrl?: string }): JSX.Element {
  return (
    <Flex row centered flexWrap="wrap" gap="$spacing4">
      <Text color="$statusCritical" textAlign="center" variant="body3">
        {message}
      </Text>
      {learnMoreUrl && (
        <LearnMoreLink onlyUseText url={learnMoreUrl} textColor="$neutral1" textVariant="buttonLabel3" />
      )}
    </Flex>
  )
}
