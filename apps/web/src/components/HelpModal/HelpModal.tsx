import { isMobileWeb } from '@universe/environment'
import { Flex, TouchableArea } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { Popover, useSporeColors } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { HelpContent } from '~/components/HelpModal/HelpContent'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export function HelpModal({
  showOnXL = false,
  flushInDrawer = false,
}: {
  showOnXL?: boolean
  flushInDrawer?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const media = useMedia()
  const colors = useSporeColors()
  const isTabletWidth = media.xl && !media.sm
  const useDrawerFooterStyle = flushInDrawer && isMobileWeb

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
          <TouchableArea
            hoverable
            {...(useDrawerFooterStyle ? { py: '$spacing4', pr: '$spacing4', pl: '$none' } : {})}
            {...ClickableTamaguiStyle}
          >
            <QuestionInCircleFilled
              size={useDrawerFooterStyle ? 24 : 20}
              color={colors.neutral1.get()}
              data-testid={TestID.HelpIcon}
            />
          </TouchableArea>
        </Popover.Trigger>
        <Popover.Content
          zIndex={zIndexes.popover}
          enterStyle={{ scale: 0.95, opacity: 0 }}
          exitStyle={{ scale: 0.95, opacity: 0 }}
          animation="quick"
          ml="$spacing12"
          backgroundColor="$transparent"
          $xl={{ ml: 0, mt: '$spacing20' }}
          $sm={{ ml: '$spacing12' }}
        >
          {/* The legacy Theme re-assertion is gone: HelpContent is fully mycelium, whose theme
              variables are global, so the portal placement no longer strips its theming. */}
          <HelpContent onClose={() => setIsOpen(false)} />
        </Popover.Content>
      </Popover>
    </Flex>
  )
}

export default HelpModal
