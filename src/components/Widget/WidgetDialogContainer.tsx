import { ForwardedRef, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

const StyledDialogContainer = styled.div<{ visible: boolean }>`
  background-color: ${({ theme }) => theme.backgroundScrim};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: background-color 0.125s ease-in-out;
  transition: visibility 0s linear 0s, opacity 0.125s;
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: ${({ visible }) => (visible ? 'all' : 'none')};
  z-index: ${Z_INDEX.modal};
`

const Dialog = styled.div`
  position: relative;
  width: 480px;
  height: 460px;
`

interface WidgetDialogContainerProps {
  visible: boolean
}

export const WidgetDialogContainer = forwardRef<HTMLDivElement, WidgetDialogContainerProps>(
  (props: WidgetDialogContainerProps, ref: ForwardedRef<HTMLDivElement>) => {
    return createPortal(
      <StyledDialogContainer visible={props.visible}>
        <Dialog ref={ref} />
      </StyledDialogContainer>,
      document.body
    )
  }
)

WidgetDialogContainer.displayName = 'WidgetDialogContainer'
