import { Toast, useToastState } from '@tamagui/toast'
import { Text, XStack } from 'ui/src'

export function BottomToast(): JSX.Element | null {
  const toastData = useToastState()

  // Don't render toast if not needed
  if (!toastData || toastData.isHandledNatively) {
    return null
  }

  return (
    <Toast
      key={toastData.id}
      unstyled
      duration={toastData.duration}
      viewportName={toastData.viewportName}
      width="100%">
      <XStack
        alignContent="center"
        alignItems="center"
        backgroundColor="$surface2"
        borderColor="$neutral3"
        borderRadius={100}
        borderWidth={1}
        flex={1}
        marginBottom="$spacing24"
        paddingHorizontal="$spacing24"
        paddingVertical="$spacing16">
        <Text variant="bodyLarge">{toastData.title ?? null}</Text>
      </XStack>
    </Toast>
  )
}
