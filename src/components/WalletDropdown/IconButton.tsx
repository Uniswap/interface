import { Icon } from 'react-feather'
import styled, { css } from 'styled-components/macro'

export const IconHoverText = styled.span`
  color: ${({ theme }) => theme.textPrimary};
  position: absolute;
  top: 28px;
  border-radius: 8px;
  transform: translateX(-50%);
  opacity: 0;
  font-size: 12px;
  padding: 5px;
  left: 10px;
`

const IconStyles = css`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;
  display: inline-block;
  cursor: pointer;
  position: relative;
  height: 32px;
  width: 32px;
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} background-color ${timing.in}`};

    ${IconHoverText} {
      opacity: 1;
    }
  }
  :active {
    background-color: ${({ theme }) => theme.backgroundSurface};
    transition: background-color 50ms linear;
  }
`

const IconBlockLink = styled.a`
  ${IconStyles};
`

const IconBlockButton = styled.button`
  ${IconStyles};
  border: none;
  outline: none;
`

const IconWrapper = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
`
interface BaseProps {
  Icon: Icon
}
interface IconLinkProps extends React.ComponentPropsWithoutRef<'a'>, BaseProps {}
interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'>, BaseProps {}

const IconBlock = (props: React.ComponentPropsWithoutRef<'a' | 'button'>) => {
  if ('href' in props) {
    return <IconBlockLink {...props} />
  }
  // ignoring 'button' 'type' conflict between React and styled-components
  // @ts-ignore
  return <IconBlockButton {...props} />
}

const IconButton = ({ Icon, children, ...rest }: IconButtonProps | IconLinkProps) => (
  <IconBlock {...rest}>
    <IconWrapper>
      <Icon strokeWidth={1.5} size={16} />
      <IconHoverText>{children}</IconHoverText>
    </IconWrapper>
  </IconBlock>
)

export default IconButton
