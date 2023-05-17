import { Trans } from '@lingui/macro'
import Tooltip from 'components/Tooltip'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const TooltipLink = styled(ThemedText.Link)`
  cursor: help;
`

export function SubtitleWithTooltip({ mainText, tooltipText }: { mainText: string; tooltipText: string }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <>
      {mainText}{' '}
      <Tooltip text={tooltipText} show={show}>
        <TooltipLink onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <Trans>Why is this required?</Trans>
        </TooltipLink>
      </Tooltip>
    </>
  )
}
