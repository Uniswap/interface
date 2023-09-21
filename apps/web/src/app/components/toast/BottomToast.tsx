import { Toast, useToastState } from '@tamagui/toast'
import { Flex, Text } from 'ui/src'

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
      <Flex
        fill
        row
        alignContent="center"
        alignItems="center"
        bg="$surface2"
        borderColor="$neutral3"
        borderRadius={100}
        borderWidth={1}
        mb="$spacing24"
        px="$spacing24"
        py="$spacing16">
        <Text variant="body1">{toastData.title ?? null}</Text>
      </Flex>
    </Toast>
  )
}
