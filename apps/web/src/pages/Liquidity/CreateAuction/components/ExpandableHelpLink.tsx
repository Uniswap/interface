import { useCallback, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'

/**
 * Inline "(?) <link>" that toggles a short help description below it. Shared by the configure-auction
 * sections (post-auction liquidity, launch threshold) so the disclosure styling stays in sync.
 */
export function ExpandableHelpLink({ label, description }: { label: string; description: string }) {
  const [expanded, setExpanded] = useState(false)
  const toggle = useCallback(() => setExpanded((prev) => !prev), [])

  return (
    <Flex gap="$spacing4">
      <TouchableArea onPress={toggle}>
        <Flex row gap="$spacing4" alignItems="center">
          <QuestionInCircleFilled size="$icon.16" color="$neutral2" />
          <Text
            variant="body3"
            color={expanded ? '$neutral1' : '$neutral2'}
            textDecorationLine="underline"
            textDecorationStyle="dashed"
          >
            {label}
          </Text>
        </Flex>
      </TouchableArea>
      {expanded ? (
        <Flex pl="$spacing20">
          <Text variant="body4" color="$neutral2">
            {description}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  )
}
