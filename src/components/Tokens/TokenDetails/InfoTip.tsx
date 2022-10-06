import Tooltip from 'components/Tooltip'
import { ReactNode, useCallback, useState } from 'react'
import { Info } from 'react-feather'
import styled from 'styled-components/macro'

const InfoTipContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  cursor: help;
`

const InfoTipBody = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
`

export default function InfoTip({ text }: { text: ReactNode; size?: number }) {
  const [show, setShow] = useState<boolean>(false)

  const open = useCallback(() => setShow(true), [setShow])
  const close = useCallback(() => setShow(false), [setShow])
  return (
    <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center', backgroundColor: 'black' }}>
      <Tooltip text={<InfoTipBody>{text}</InfoTipBody>} show={show} placement="right">
        <InfoTipContainer onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <Info size={14} />
        </InfoTipContainer>
      </Tooltip>
    </span>
  )
}
