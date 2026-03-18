import { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { TouchableArea } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'

interface InternalLinkProps {
  to: string
  children: ReactNode
  hoverStyle?: React.ComponentProps<typeof TouchableArea>['hoverStyle']
}

/**
 * A link component for internal navigation that renders as an <a> tag.
 */
export function InternalLink({ to, children, hoverStyle }: InternalLinkProps): JSX.Element {
  const navigate = useNavigate()

  const handlePress = useEvent(() => {
    navigate(to)
  })

  return (
    <TouchableArea tag="a" onPress={handlePress} hoverStyle={hoverStyle}>
      {children}
    </TouchableArea>
  )
}
