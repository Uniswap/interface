import { useSpring } from '@react-spring/web'
import { ReactNode, useRef, useState } from 'react'

import { useIsMobile } from '../../hooks'
import { AnimatedBox, Box } from '../Box'

const MIN_DISTANCE_FROM_EDGE = 40

const isLeftOutOfBounds = (baseRefXPos: number, baseRefWidth: number, toolTipWidth: number) => {
  return baseRefXPos - (toolTipWidth / 2 - baseRefWidth / 2) < MIN_DISTANCE_FROM_EDGE
}

const isRightOutOfBounds = (baseRefXPos: number, baseRefWidth: number, toolTipWidth: number) => {
  return baseRefXPos + baseRefWidth + (toolTipWidth / 2 - baseRefWidth / 2) > window.innerWidth - MIN_DISTANCE_FROM_EDGE
}

const safeRightOverflowLocation = (baseRefXPos: number, toolTipWidth: number) => {
  return window.innerWidth - MIN_DISTANCE_FROM_EDGE - baseRefXPos - toolTipWidth
}

const centeredTooltipLocation = (baseRefWidth: number, toolTipWidth: number) => {
  return baseRefWidth / 2 - toolTipWidth / 2
}

export const AssetToolTip = ({
  prompt,
  tooltipPrompt,
  url,
}: {
  prompt: ReactNode
  tooltipPrompt: ReactNode
  url?: string
}) => {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const cardRef = useRef<HTMLInputElement>(null)
  const toolTipRef = useRef<HTMLInputElement>(null)
  const cardSpring = useSpring({
    opacity: isOpen ? 1 : 0,
  })

  return (
    <Box position={'relative'}>
      {/* 
      // @ts-ignore */}
      <AnimatedBox
        position="absolute"
        ref={toolTipRef}
        display="flex"
        alignItems="center"
        width="max"
        fontSize="14"
        boxShadow="tooltip"
        backgroundColor="white"
        color="darkGray"
        paddingTop="8"
        paddingBottom="8"
        paddingLeft="12"
        paddingRight="12"
        borderRadius="4"
        cursor="default"
        zIndex="2"
        // @ts-ignore
        style={{
          ...cardSpring,
          left:
            cardRef && cardRef.current && toolTipRef && toolTipRef.current
              ? isLeftOutOfBounds(
                  cardRef.current.getBoundingClientRect().x,
                  cardRef.current.getBoundingClientRect().width,
                  toolTipRef.current.getBoundingClientRect().width
                )
                ? MIN_DISTANCE_FROM_EDGE - cardRef.current.getBoundingClientRect().x
                : isRightOutOfBounds(
                    cardRef.current.getBoundingClientRect().x,
                    cardRef.current.getBoundingClientRect().width,
                    toolTipRef.current.getBoundingClientRect().width
                  )
                ? safeRightOverflowLocation(
                    cardRef.current.getBoundingClientRect().x,
                    toolTipRef.current.getBoundingClientRect().width
                  )
                : centeredTooltipLocation(
                    cardRef.current.getBoundingClientRect().width,
                    toolTipRef.current.getBoundingClientRect().width
                  )
              : -MIN_DISTANCE_FROM_EDGE,
          top: toolTipRef && toolTipRef.current ? -12 - toolTipRef.current.getBoundingClientRect().height : -37,
          // visibility: cardSpring.opacity.to((x) => (x === 0 ? 'hidden' : 'visible')),
        }}
      >
        {tooltipPrompt}
      </AnimatedBox>
      <Box
        position="relative"
        ref={cardRef}
        as="a"
        href={url}
        target="_blank"
        rel="noreferrer"
        fontSize="10"
        color="white"
        fontWeight="medium"
        display="flex"
        alignItems="center"
        zIndex="1"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => {
          if (isMobile && !isOpen) {
            setIsOpen(true)
            return false
          } else if (isMobile && !url) {
            setIsOpen(false)
            return false
          }
          return false
        }}
      >
        {prompt}
      </Box>
    </Box>
  )
}

export default AssetToolTip
