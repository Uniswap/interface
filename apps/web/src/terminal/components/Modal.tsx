import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { terminalColors, terminalFonts, terminalScrim, terminalShadows } from '~/terminal/theme/tokens'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Renders the Terminal modal header (Space Grotesk 600 18px + close button) when set. */
  title?: string
  /** Card width in px. Design: 424 (B8 confirm swap), 400 (B9 connect wallet), 640 (B11 palette). */
  width?: number
  /** Card radius in px. Design: 22 (B8/B9), 18 (B11 palette). */
  radius?: number
  /** `center` (B8/B9) or `top` (B11 palette sits 70px from the top). */
  align?: 'center' | 'top'
  /** Distance from the top when `align="top"`. Default 70 (B11). */
  topOffset?: number
  /** Show the 30×30 close button in the header. Default true when `title` is set. */
  showClose?: boolean
  /** Close when the scrim is clicked. Default true. */
  closeOnScrimClick?: boolean
  /** Accessible label when no `title` is rendered. */
  ariaLabel?: string
  children: ReactNode
}

/**
 * Terminal modal — pixel-perfect to B8/B9: full-screen scrim `rgba(11,15,20,.42)`
 * over a blurred backdrop (`backdrop-filter: blur(6px)`), centered white card
 * with 22px radius (18px for the palette) and shadow
 * `0 40px 90px -20px rgba(11,15,20,.5)`. Esc and scrim-click close; body scroll
 * locks while open. Rendered in a portal.
 */
export function Modal({
  open,
  onClose,
  title,
  width = 424,
  radius = 22,
  align = 'center',
  topOffset = 70,
  showClose,
  closeOnScrimClick = true,
  ariaLabel,
  children,
}: ModalProps): JSX.Element | null {
  // Esc closes.
  useEffect(() => {
    if (!open) {
      return undefined
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) {
      return undefined
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) {
    return null
  }

  const wantsClose = showClose ?? Boolean(title)

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: align === 'top' ? 'flex-start' : 'center',
        justifyContent: 'center',
        paddingTop: align === 'top' ? topOffset : 0,
      }}
    >
      {/* Scrim + blurred backdrop */}
      <div
        onClick={closeOnScrimClick ? onClose : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          background: terminalScrim,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        style={{
          position: 'relative',
          zIndex: 1,
          width,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          background: terminalColors.bg,
          borderRadius: radius,
          boxShadow: terminalShadows.modal,
          overflow: 'hidden',
          fontFamily: terminalFonts.sans,
          color: terminalColors.ink,
        }}
      >
        {title ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 22px 14px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: terminalFonts.display,
                fontWeight: 600,
                fontSize: 18,
                color: terminalColors.ink,
              }}
            >
              {title}
            </span>
            {wantsClose ? <ModalCloseButton onClose={onClose} /> : null}
          </div>
        ) : null}
        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function ModalCloseButton({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: terminalColors.panel2,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={terminalColors.ink2} strokeWidth={2.4}>
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
