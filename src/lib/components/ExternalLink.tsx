import { HTMLProps } from 'react'

/**
 * Outbound link
 */
export default function ExternalLink({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref' | 'onClick'> & { href?: string }) {
  return (
    <a target={target} rel={rel} href={href} {...rest}>
      {rest.children}
    </a>
  )
}
