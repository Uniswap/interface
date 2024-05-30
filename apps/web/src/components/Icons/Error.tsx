import { useTheme } from 'styled-components'

import { StyledSVG } from './shared'

export default function Error({ size = '24px', ...rest }: { size?: string; [k: string]: any }) {
  const theme = useTheme()
  return (
    <StyledSVG viewBox="0 0 24 24" fill={theme.critical} xmlns="http://www.w3.org/2000/svg" size={size} {...rest}>
      <path
        d="M21.512 7.067l-4.579-4.58A1.668 1.668 0 0 0 15.754 2H8.246a1.67 1.67 0 0 0-1.179.488l-4.58 4.579A1.668 1.668 0 0 0 2 8.246v7.508c0 .442.176.866.488 1.179l4.579 4.58c.312.311.737.487 1.179.487h7.508a1.67 1.67 0 0 0 1.179-.488l4.58-4.579c.311-.312.487-.737.487-1.179V8.246c0-.442-.175-.867-.488-1.179zm-6.146 7.121a.834.834 0 0 1-1.178 1.18L12 13.177l-2.189 2.19a.831.831 0 0 1-1.177 0 .834.834 0 0 1 0-1.18L10.822 12 8.632 9.81a.834.834 0 1 1 1.18-1.179L12 10.821l2.189-2.19a.834.834 0 0 1 1.178 1.18l-2.188 2.188 2.186 2.19z"
        fill="#9B9B9B"
      />
    </StyledSVG>
  )
}
