import styled, { CSSProperties, css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { Swap as SwapIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'

const ArrowWrapper = styled.div<{ rotated?: boolean; isVertical?: boolean; disable?: boolean }>`
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.buttonBlack};
  width: fit-content;
  height: fit-content;
  border-radius: 999px;

  transform: rotate(
    ${({ rotated, isVertical }) => {
      if (isVertical) return rotated ? '270deg' : '90deg'
      return rotated ? '180deg' : '0'
    }}
  );
  transition: transform 300ms;
  width: 40px;
  height: 40px;
  ${({ disable }) =>
    !disable &&
    css`
      cursor: pointer;
      :hover {
        opacity: 0.8;
      }
    `};
`

// arrow can rotate
export default function ArrowRotate({
  rotate,
  onClick,
  isVertical = false,
  style = {},
}: {
  rotate: boolean
  onClick?: () => void
  isVertical?: boolean
  style?: CSSProperties
}) {
  const theme = useTheme()
  return (
    <ArrowWrapper disable={!onClick} rotated={rotate} isVertical={isVertical} onClick={onClick} style={style}>
      <SwapIcon size={24} color={theme.subText} />
    </ArrowWrapper>
  )
}

const StyledIcon = styled.div<{ $rotate?: boolean; size?: number; color?: string }>`
  transition: transform 300ms;
  transform: rotate(${({ $rotate }) => ($rotate ? '-180deg' : '0')});
  path {
    fill: ${({ color }) => color || 'currentColor'};
  }
`
// arrow icon can rotate
export const DropdownArrowIcon = ({
  rotate,
  size = 24,
  color,
}: {
  rotate?: boolean
  size?: number
  color?: string
}) => {
  return (
    <StyledIcon $rotate={rotate} style={{ width: size, height: size }} color={color}>
      <DropdownSVG width={size} />
    </StyledIcon>
  )
}
