import React, { useCallback } from 'react'
import { Anchor, type GetProps, styled } from 'ui/src'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { anonymizeLink } from '~/utils/anonymizeLink'

function outboundLink({ label }: { label: string }) {
  sendAnalyticsEvent(InterfaceEventName.ExternalLinkClicked, {
    label,
  })
}

const StyledLink = styled(Anchor, {
  cursor: 'pointer',
  textDecorationLine: 'none',
  color: '$accent1',
  fontWeight: '$medium',
  '$platform-web': {
    textDecoration: 'none',
    transitionProperty: 'opacity',
    transitionDuration: '125ms',
    textDecorationLine: 'none',
  },
  hoverStyle: {
    opacity: 0.6,
  },
  pressStyle: {
    opacity: 0.4,
  },
  animation: 'fast',
  animateOnly: ['opacity'],
})

type StyledLinkProps = GetProps<typeof StyledLink>
type LinkPressEvent = Parameters<NonNullable<StyledLinkProps['onPress']>>[0]

function hasGetModifierState(
  event: LinkPressEvent,
): event is LinkPressEvent & { getModifierState: (key: string) => boolean } {
  return 'getModifierState' in event && typeof event.getModifierState === 'function'
}

function isModifiedClick(event: LinkPressEvent): boolean {
  if (hasGetModifierState(event)) {
    return event.getModifierState('Control') || event.getModifierState('Meta')
  }
  return false
}

function handleClickExternalLink(event: LinkPressEvent, { href, target }: { href?: string; target?: string }): void {
  if (!href) {
    return
  }

  const anonymizedHref = anonymizeLink(href)

  // don't prevent default, don't redirect if it's a new tab
  if (target === '_blank' || isModifiedClick(event)) {
    outboundLink({ label: anonymizedHref })
  } else {
    event.preventDefault()
    // send a ReactGA event and then trigger a location change
    outboundLink({ label: anonymizedHref })
  }
}

export type ExternalLinkProps = StyledLinkProps & {
  /** Merged with outbound telemetry (DOM / legacy callers). */
  onClick?: (event: LinkPressEvent) => void
}

/**
 * Outbound link that handles firing google analytics events
 */
export function ExternalLink({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  onClick,
  onPress,
  ...rest
}: ExternalLinkProps) {
  const handlePress = useCallback(
    (event: LinkPressEvent) => {
      handleClickExternalLink(event, { href, target })
      onClick?.(event)
      onPress?.(event)
    },
    [href, target, onClick, onPress],
  )
  return <StyledLink href={href} rel={rel} target={target} {...rest} onPress={handlePress} />
}
