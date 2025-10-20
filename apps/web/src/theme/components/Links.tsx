import styled, { css } from 'lib/styled-components'
import React, { HTMLProps, useCallback } from 'react'
import { Link } from 'react-router'
import { ClickableStyle } from 'theme/components/styles'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { anonymizeLink } from 'utils/anonymizeLink'

const LinkStyle = css`
  color: ${({ theme }) => theme.accent1};
  stroke: ${({ theme }) => theme.accent1};
  font-weight: 500;
`

// An internal link from the react-router library that is correctly styled
export const StyledInternalLink = styled(Link)`
  ${ClickableStyle}
  ${LinkStyle}
`

function outboundLink({ label }: { label: string }) {
  sendAnalyticsEvent(InterfaceEventName.ExternalLinkClicked, {
    label,
  })
}

function handleClickExternalLink(event: React.MouseEvent<HTMLAnchorElement>) {
  const { target, href } = event.currentTarget

  const anonymizedHref = anonymizeLink(href)

  // don't prevent default, don't redirect if it's a new tab
  if (target === '_blank' || event.ctrlKey || event.metaKey) {
    outboundLink({ label: anonymizedHref })
  } else {
    event.preventDefault()
    // send a ReactGA event and then trigger a location change
    outboundLink({ label: anonymizedHref })
  }
}

const StyledLink = styled.a`
  ${ClickableStyle}
  ${LinkStyle}
`

/**
 * Outbound link that handles firing google analytics events
 */
export function ExternalLink({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      handleClickExternalLink(event)
      if (rest.onClick) {
        rest.onClick(event)
      }
    },
    [rest.onClick],
  )
  return <StyledLink target={target} rel={rel} href={href} onClick={handleClick} {...rest} />
}
