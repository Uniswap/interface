import { useCallback } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'

export function CopyRow({ value, onCopy }: { value: string; onCopy: (value: string) => void }): JSX.Element {
  const handlePress = useCallback(() => {
    onCopy(value)
  }, [onCopy, value])

  return (
    <TouchableArea onPress={handlePress}>
      <Flex row gap="$spacing4">
        <CopyAlt size="$icon.16" />
        <Text variant="body3">{value}</Text>
      </Flex>
    </TouchableArea>
  )
}
