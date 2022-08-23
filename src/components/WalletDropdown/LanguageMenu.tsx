import { Trans } from '@lingui/macro'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Check } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components/macro'

import { SlideOutMenu } from './SlideOutMenu'

const InternalMenuItem = styled(Link)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.textTertiary};
  :hover {
    cursor: pointer;
  }
`

const InternalLinkMenuItem = styled(InternalMenuItem)<{ isActive: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  justify-content: space-between;
  text-decoration: none;
  background-color: ${({ isActive, theme }) => isActive && theme.accentActionSoft};
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    cursor: pointer;
    background-color: ${({ isActive, theme }) => !isActive && theme.backgroundModule};
    transition: 250ms background-color ease;
  }
`

const LanguageWrap = styled.div`
  margin-top: 16px;
`

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem isActive={isActive} onClick={onClick} to={to}>
      <Text fontSize={16} fontWeight={400} lineHeight="24px">
        {LOCALE_LABEL[locale]}
      </Text>
      {isActive && <Check color={theme.accentAction} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}

const LanguageMenu = ({ onClose }: { onClose: () => void }) => {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Language</Trans>} onClose={onClose}>
      <LanguageWrap>
        {SUPPORTED_LOCALES.map((locale) => (
          <LanguageMenuItem locale={locale} isActive={activeLocale === locale} key={locale} />
        ))}
      </LanguageWrap>
    </SlideOutMenu>
  )
}

export default LanguageMenu
