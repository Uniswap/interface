import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { css, deprecatedStyled } from 'lib/styled-components'
import { FadePresence, FadePresenceAnimationType } from 'theme/components/FadePresence'
import { useSporeColors } from 'ui/src'

export const LogoContainer = deprecatedStyled.div`
  height: 64px;
  width: 64px;
  position: relative;
  display: flex;
  justify-content: center;
  border-radius: 50%;
  overflow: visible;
`

const LoadingIndicator = deprecatedStyled(LoaderV3)`
  stroke: ${({ theme }) => theme.neutral3};
  fill: ${({ theme }) => theme.neutral3};
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  top: -4px;
  left: -4px;
  position: absolute;
`

export function LoadingIndicatorOverlay() {
  return (
    <FadePresence>
      <LoadingIndicator />
    </FadePresence>
  )
}

export function ConfirmedIcon({ className }: { className?: string }) {
  const colors = useSporeColors()
  return (
    <FadePresence animationType={FadePresenceAnimationType.FadeAndScale}>
      <svg
        data-testid="confirmed-icon"
        width="54"
        height="54"
        viewBox="0 0 54 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M27 0.333008C12.28 0.333008 0.333313 12.2797 0.333313 26.9997C0.333313 41.7197 12.28 53.6663 27 53.6663C41.72 53.6663 53.6666 41.7197 53.6666 26.9997C53.6666 12.2797 41.72 0.333008 27 0.333008ZM37.7466 22.1997L25.2933 34.6263C24.9199 35.0263 24.4133 35.2131 23.8799 35.2131C23.3733 35.2131 22.8666 35.0263 22.4666 34.6263L16.2533 28.4131C15.48 27.6398 15.48 26.3596 16.2533 25.5863C17.0266 24.8129 18.3066 24.8129 19.08 25.5863L23.8799 30.3864L34.92 19.373C35.6933 18.573 36.9733 18.573 37.7466 19.373C38.52 20.1464 38.52 21.3997 37.7466 22.1997Z"
          fill={colors.statusSuccess.val}
        />
      </svg>
    </FadePresence>
  )
}

export function SubmittedIcon({ className }: { className?: string }) {
  const colors = useSporeColors()
  return (
    <FadePresence animationType={FadePresenceAnimationType.FadeAndScale}>
      <svg
        data-testid="submitted-icon"
        width="54"
        height="54"
        viewBox="0 0 54 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M26.9997 0.333496C12.2717 0.333496 0.333008 12.2722 0.333008 27.0002C0.333008 41.7282 12.2717 53.6668 26.9997 53.6668C41.7277 53.6668 53.6663 41.7282 53.6663 27.0002C53.6663 12.2722 41.7277 0.333496 26.9997 0.333496ZM36.4131 25.7469C36.0238 26.1362 35.5117 26.3335 34.9997 26.3335C34.4877 26.3335 33.9756 26.1389 33.5863 25.7469L28.9997 21.1603V37.6668C28.9997 38.7708 28.1037 39.6668 26.9997 39.6668C25.8957 39.6668 24.9997 38.7708 24.9997 37.6668V21.1629L20.4131 25.7495C19.6318 26.5308 18.365 26.5308 17.5837 25.7495C16.8023 24.9682 16.8023 23.7014 17.5837 22.9201L25.5837 14.9201C25.7677 14.7361 25.9887 14.5898 26.2341 14.4884C26.722 14.2858 27.274 14.2858 27.762 14.4884C28.0074 14.5898 28.2291 14.7361 28.4131 14.9201L36.4131 22.9201C37.1944 23.7014 37.1944 24.9656 36.4131 25.7469Z"
          fill={colors.accent1.val}
        />
      </svg>
    </FadePresence>
  )
}

const IconCss = css`
  height: 64px;
  width: 64px;
`

export const AnimatedEntranceConfirmationIcon = deprecatedStyled(ConfirmedIcon)`
  ${IconCss}
`

export const AnimatedEntranceSubmittedIcon = deprecatedStyled(SubmittedIcon)`
  ${IconCss}
`
