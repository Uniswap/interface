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

const InternalLinkMenuItem = styled(InternalMenuItem)<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  justify-content: space-between;
  text-decoration: none;
  background-color: ${({ active, theme }) => active && theme.accentActionSoft};
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    cursor: pointer;
  }
`

const LanguageWrap = styled.div`
  margin-top: 16px;
`

function LanguageMenuItem({ locale, active }: { locale: SupportedLocale; active: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem active={active} onClick={onClick} to={to}>
      <Text fontSize={16} fontWeight={400} lineHeight="24px">
        {LOCALE_LABEL[locale]}
      </Text>
      {active && <Check color={theme.accentAction} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}

export const LanguageMenu = ({ close }: { close: () => void }) => {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Language</Trans>} close={close}>
      <LanguageWrap>
        {SUPPORTED_LOCALES.map((locale) => (
          <LanguageMenuItem locale={locale} active={activeLocale === locale} key={locale} />
        ))}
      </LanguageWrap>
    </SlideOutMenu>
  )
}
