import Portal from '@reach/portal'
import { PropsWithChildren, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function SendButtonTooltip({
  children,
  isSolanaOnlyWallet: disabled,
}: PropsWithChildren<{ isSolanaOnlyWallet: boolean }>) {
  const { t } = useTranslation()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const colors = useSporeColors()

  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, width: 0 })

  const handleMouseEnter = useEvent(() => {
    if (disabled && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      // Get the parent container of Send/Receive tiles
      const tilesContainer = wrapperRef.current.parentElement
      const tilesRect = tilesContainer?.getBoundingClientRect()

      if (tilesRect) {
        // Position tooltip to match the width of action tiles container
        setTooltipPosition({
          top: rect.bottom + 8,
          left: tilesRect.left + tilesRect.width / 2,
          width: tilesRect.width, // Match action tiles container width
        })
      } else {
        // Fallback if container not found
        setTooltipPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
          width: rect.width * 2 + 8,
        })

        logger.error(new Error('SendButtonTooltip: tiles container not found'), {
          tags: {
            file: 'SendButtonTooltip.tsx',
            function: 'handleMouseEnter',
          },
        })
      }

      setShowTooltip(true)
    }
  })

  const handleMouseLeave = useEvent(() => setShowTooltip(false))

  if (!disabled) {
    return <>{children}</>
  }

  return (
    <>
      <Flex ref={wrapperRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} grow>
        {children}
      </Flex>

      {showTooltip && (
        <Portal>
          <Flex
            row
            $platform-web={{
              position: 'fixed',
            }}
            animateEnterExit="fadeInOut"
            alignItems="center"
            justifyContent="center"
            gap="$spacing8"
            top={tooltipPosition.top}
            left={tooltipPosition.left}
            width={tooltipPosition.width}
            transform="translateX(-50%)"
            backgroundColor="$surface1"
            borderWidth={1}
            borderColor="$surface3"
            borderRadius="$rounded12"
            paddingHorizontal="$spacing16"
            paddingVertical="$spacing12"
            boxSizing="border-box"
            boxShadow="$shadow1"
            pointerEvents="none"
            zIndex="$tooltip"
          >
            <InfoCircleFilled size={16} color={colors.neutral2.val} />
            <Text variant="body3">{t('send.unavailableOnSolana.message')}</Text>
          </Flex>
        </Portal>
      )}
    </>
  )
}
