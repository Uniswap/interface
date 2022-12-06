import { useCallback } from 'react'
import { ExternalLink } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ClickableStyle } from 'theme'
import { isIOS } from 'utils/userAgent'

export const BaseButton = styled.button<{ padded?: boolean }>`
  ${ClickableStyle}
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  padding: ${({ padded }) => (padded ? '8px 24px' : '8px 12px')};
  border: none;
  white-space: nowrap;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;

  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  color: ${({ theme }) => theme.textPrimary};
`

const StyledButton = styled(BaseButton)`
  /* Dark Theme/Accent/Promotional */
  background: ${({ theme }) => theme.promotionalGradient};

  color: ${({ theme }) => theme.accentTextLightPrimary};
`

export const APP_STORE_LINK = 'https://apps.apple.com/us/app/tiktok/id835599320'

export function DownloadButton({ onClick, text = 'Download' }: { onClick?: () => void; text?: string }) {
  const navigate = useNavigate()
  const onButtonClick = useCallback(() => {
    // handles any actions required by the parent, i.e. cancelling wallet connection attempt
    onClick?.()
    navigate('/wallet')
  }, [onClick, navigate])

  if (isIOS) {
    return (
      <StyledButton onClick={() => window.open(APP_STORE_LINK)}>
        <ExternalLink size="14px" />
        App Store
      </StyledButton>
    )
  }
  return (
    <StyledButton onClick={onButtonClick} padded>
      {text}
    </StyledButton>
  )
}
