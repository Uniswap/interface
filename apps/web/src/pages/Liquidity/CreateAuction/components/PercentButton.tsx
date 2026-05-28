import { Text, TouchableArea } from 'ui/src'

interface PercentButtonProps {
  label: string
  isActive: boolean
  onPress: () => void
}

export function PercentButton({ label, isActive, onPress }: PercentButtonProps) {
  return (
    <TouchableArea
      flex={1}
      flexBasis={0}
      minWidth={0}
      width="100%"
      overflow="hidden"
      backgroundColor={isActive ? '$surface3' : 'transparent'}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      px="$spacing8"
      py="$spacing6"
      alignItems="center"
      justifyContent="center"
      onPress={onPress}
    >
      <Text variant="buttonLabel4" color="$neutral1" textAlign="center" numberOfLines={1}>
        {label}
      </Text>
    </TouchableArea>
  )
}
