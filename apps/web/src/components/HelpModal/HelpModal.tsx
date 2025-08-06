import { HelpContent } from 'components/HelpModal/HelpContent'
import { useState } from 'react'
import { Flex, Popover } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Flex
      $platform-web={{
        position: 'fixed',
      }}
      bottom="$spacing20"
      left="$spacing20"
      $sm={{
        position: 'relative',
        bottom: 0,
        left: 0,
      }}
      zIndex="$modal"
    >
      <Popover placement="top" stayInFrame allowFlip open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <Popover.Trigger>
          <QuestionInCircleFilled size={20} />
        </Popover.Trigger>
        <Popover.Content
          enterStyle={{ scale: 0.95, opacity: 0 }}
          exitStyle={{ scale: 0.95, opacity: 0 }}
          ml="$spacing12"
        >
          <HelpContent onClose={() => setIsOpen(false)} />
        </Popover.Content>
      </Popover>
    </Flex>
  )
}
