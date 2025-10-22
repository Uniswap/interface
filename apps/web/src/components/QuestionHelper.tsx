import { Placement } from '@popperjs/core'
import { MouseoverTooltip } from 'components/Tooltip'
import { ReactNode, useCallback, useState } from 'react'
import { Flex, styled } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

const InfoIconWrapper = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$rounded12',
  width: 18,
  height: 18,
  outlineWidth: 0,
  borderWidth: 0,
  cursor: 'default',
  hoverStyle: {
    opacity: 0.7,
  },
})

export default function QuestionHelper({
  text,
  size = 16,
  placement,
}: {
  text: ReactNode
  size?: number
  placement?: Placement
}) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [])
  const close = useCallback(() => setShow(false), [])
  return (
    <Flex ml="$spacing4" alignItems="center">
      <MouseoverTooltip text={text} forceShow={show} placement={placement}>
        <InfoIconWrapper onPress={open} onMouseEnter={open} onMouseLeave={close}>
          <InfoCircleFilled size={size} color="$neutral3" />
        </InfoIconWrapper>
      </MouseoverTooltip>
    </Flex>
  )
}
