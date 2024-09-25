import { CloseIcon } from 'theme/components'
import { Flex, Text } from 'ui/src'

export function LiquidityModalHeader({ title, closeModal }: { title: string; closeModal: () => void }) {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing4" width="100%">
      <CloseIcon data-testid="LiquidityModalHeader-close" onClick={closeModal} size={24} />
      <Text variant="body2" flexGrow={1} textAlign="center" pr={24}>
        {title}
      </Text>
    </Flex>
  )
}
