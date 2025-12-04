import { HelpContent } from 'components/HelpModal/HelpContent'
import { useState } from 'react'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Popover, TouchableArea, useMedia } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function HelpModal({ showOnXL = false }: { showOnXL?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const media = useMedia()
  const isTabletWidth = media.xl && !media.sm

  return (
    <Flex
      $platform-web={{
        position: 'fixed',
      }}
      bottom="$spacing20"
      left="$spacing20"
      $xl={
        showOnXL
          ? {
              position: 'relative',
              bottom: 0,
              left: 0,
            }
          : {
              display: 'none',
            }
      }
      zIndex="$modal"
    >
      <Popover
        placement={isTabletWidth ? 'bottom' : 'top'}
        stayInFrame
        allowFlip
        open={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <Popover.Trigger>
          <TouchableArea hoverable {...ClickableTamaguiStyle}>
            <QuestionInCircleFilled size={20} data-testid={TestID.HelpIcon} />
          </TouchableArea>
        </Popover.Trigger>
        <Popover.Content
          zIndex={zIndexes.popover}
          enterStyle={{ scale: 0.95, opacity: 0 }}
          exitStyle={{ scale: 0.95, opacity: 0 }}
          animation="quick"
          ml="$spacing12"
          background="transparent"
          $xl={{ ml: 0, mt: '$spacing20' }}
          $sm={{ ml: '$spacing12' }}
        >
          <HelpContent onClose={() => setIsOpen(false)} />
        </Popover.Content>
      </Popover>
    </Flex>
  )
}
