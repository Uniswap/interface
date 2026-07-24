import type { ReactNode } from 'react'
import { Flex } from 'ui/src'

interface EarnReviewLayoutProps {
  children: ReactNode
  action: JSX.Element
  /**
   * Renders content and action separately so the mobile bottom-sheet modal can pin the action in a
   * footer overlay (no layout shift while the sheet resizes). Padding is left to the layout.
   */
  renderLayout?: (parts: { content: JSX.Element; action: JSX.Element }) => JSX.Element
}

/** Shared column layout for the Earn deposit/withdraw review views. */
export function EarnReviewLayout({ children, action, renderLayout }: EarnReviewLayoutProps): JSX.Element {
  const content = (
    <Flex gap="$spacing16">
      {children}
      {!renderLayout && action}
    </Flex>
  )

  return renderLayout ? renderLayout({ content, action }) : content
}

export type EarnReviewRenderLayout = EarnReviewLayoutProps['renderLayout']
