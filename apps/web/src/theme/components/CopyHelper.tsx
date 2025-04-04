import { ReactComponent as TooltipTriangle } from 'assets/svg/tooltip_triangle.svg'
import useCopyClipboard from 'hooks/useCopyClipboard'
import styled from 'lib/styled-components'
import { PropsWithChildren, ReactNode, forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { CheckCircle, Copy, Icon } from 'react-feather'
import { Trans } from 'react-i18next'
import { ClickableStyle, EllipsisStyle } from 'theme/components/styles'
import { Z_INDEX } from 'theme/zIndex'
import { Flex, isTouchable } from 'ui/src'

const TOOLTIP_WIDTH = 60

const ToolTipWrapper = styled.div<{ isCopyContractTooltip?: boolean; tooltipX?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  left: ${({ isCopyContractTooltip, tooltipX }) =>
    isCopyContractTooltip && (tooltipX ? `${tooltipX - TOOLTIP_WIDTH / 2}px` : '50%')};
  transform: translate(5px, 32px);
  z-index: ${Z_INDEX.tooltip};
`

const StyledTooltipTriangle = styled(TooltipTriangle)`
  path {
    fill: ${({ theme }) => theme.black};
  }
`

const CopiedTooltip = styled.div<{ isCopyContractTooltip?: boolean }>`
  background-color: ${({ theme }) => theme.black};
  text-align: center;
  justify-content: center;
  width: ${({ isCopyContractTooltip }) => !isCopyContractTooltip && `${TOOLTIP_WIDTH}px`};
  height: ${({ isCopyContractTooltip }) => !isCopyContractTooltip && '32px'};
  line-height: ${({ isCopyContractTooltip }) => !isCopyContractTooltip && '32px'};

  padding: ${({ isCopyContractTooltip }) => isCopyContractTooltip && '8px'};
  border-radius: 8px;

  color: ${({ theme }) => theme.white};
  font-size: 12px;
`

function Tooltip({ isCopyContractTooltip, tooltipX }: { isCopyContractTooltip: boolean; tooltipX?: number }) {
  return (
    <ToolTipWrapper isCopyContractTooltip={isCopyContractTooltip} tooltipX={tooltipX}>
      <StyledTooltipTriangle />
      <CopiedTooltip isCopyContractTooltip={isCopyContractTooltip}>Copied</CopiedTooltip>
    </ToolTipWrapper>
  )
}

const CopyIconWrapper = styled.div`
  text-decoration: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  display: flex;
`

export function CopyToClipboard({ toCopy, children }: PropsWithChildren<{ toCopy: string }>) {
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])
  return (
    <CopyIconWrapper onClick={copy}>
      {children}
      {isCopied && <Tooltip isCopyContractTooltip={false} />}
    </CopyIconWrapper>
  )
}

const CopyHelperContainer = styled.div<{ clicked: boolean; color?: string; gap: number }>`
  ${ClickableStyle}
  display: flex;
  flex-direction: row;
  gap: ${({ gap }) => gap + 'px'};
  align-items: center;
  color: ${({ color }) => color ?? 'inherit'};
`

const CopyHelperText = styled.div<{ fontSize?: number; offset: number }>`
  ${EllipsisStyle}
  ${({ fontSize }) => (fontSize ? 'font-size: ' + fontSize + 'px' : 'inherit')};
  max-width: calc(100% - ${({ offset }) => offset + 'px'});
`

const StyledCheckCircle = styled(CheckCircle)`
  color: ${({ theme }) => theme.success};
  stroke-width: 1.5px;
`

function isEllipsisActive(element: HTMLDivElement | null) {
  return Boolean(element && element.offsetWidth < element.scrollWidth)
}

interface CopyHelperProps {
  InitialIcon?: Icon | null
  CopiedIcon?: Icon
  toCopy: string
  color?: string
  fontSize?: number
  iconSize?: number
  gap?: number
  iconPosition?: 'left' | 'right'
  iconColor?: string
  children: ReactNode
}

type CopyHelperRefType = { forceCopy: () => void }

export const CopyHelper = forwardRef<CopyHelperRefType, CopyHelperProps>(
  (
    {
      InitialIcon = Copy,
      CopiedIcon = StyledCheckCircle,
      toCopy,
      color,
      fontSize,
      iconSize = 20,
      gap = 4,
      iconPosition = 'left',
      iconColor = 'currentColor',
      children,
    }: CopyHelperProps,
    ref,
  ) => {
    const [isCopied, setCopied] = useCopyClipboard()
    const copy = useCallback(() => {
      setCopied(toCopy)
    }, [toCopy, setCopied])

    useImperativeHandle(ref, () => ({
      forceCopy() {
        copy()
      },
    }))

    // Detects is text is ellipsing in order to shorten gap caused by extra space browsers add after ... chars
    const textRef = useRef<HTMLDivElement>(null)
    const isEllipsis = isEllipsisActive(textRef.current)
    const displayGap = isEllipsis ? gap - 4 : gap

    const [isHover, setIsHover] = useState(false)
    const onHover = useCallback(() => setIsHover(true), [])
    const offHover = useCallback(() => setIsHover(false), [])

    // Copy-helpers w/ left icon always show icon & display "Copied!" in copied state
    // Copy-helpers w/ right icon show icon on hover & do not change text
    const showIcon = Boolean(iconPosition === 'left' || isHover || isTouchable || isCopied)
    const Icon = isCopied ? CopiedIcon : showIcon ? InitialIcon : null
    const offset = showIcon ? gap + iconSize : 0
    return (
      <CopyHelperContainer
        onClick={copy}
        color={color}
        clicked={isCopied}
        gap={displayGap}
        onMouseEnter={onHover}
        onMouseLeave={offHover}
      >
        {iconPosition === 'left' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
        <CopyHelperText ref={textRef} fontSize={fontSize} offset={offset}>
          {isCopied && iconPosition === 'left' ? <Trans i18nKey="common.copied" /> : children}
        </CopyHelperText>
        <Flex $platform-web={{ clear: 'both' }} />
        {iconPosition === 'right' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
      </CopyHelperContainer>
    )
  },
)
CopyHelper.displayName = 'CopyHelper'
