import { Trans } from '@lingui/macro'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Check } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

import { SlideOutMenu } from './SlideOutMenu'

const InternalMenuItem = styled(Link)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.textTertiary};
  :hover {
    color: ${({ theme }) => theme.textTertiary};
    cursor: pointer;
    text-decoration: none;
  }
`

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    color: ${({ theme }) => theme.textPrimary};
    cursor: pointer;
    text-decoration: none;
  }
`

//
function LanguageMenuItem({ locale, active }: { locale: SupportedLocale; active: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)

  if (!to) return null

  return (
    <InternalLinkMenuItem
      style={{
        backgroundColor: active ? 'rgba(76, 130, 251, 0.12)' : '',
      }}
      onClick={onClick}
      to={to}
    >
      <Text fontSize={16} fontWeight={400} lineHeight="24px">
        {LOCALE_LABEL[locale]}
      </Text>
      {active && <Check color={colors.blue400} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}

export const LanguageMenu = ({ close }: { close: () => void }) => {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Language</Trans>} close={close}>
      <div style={{ marginTop: 16 }}>
        {SUPPORTED_LOCALES.map((locale) => (
          <LanguageMenuItem locale={locale} active={activeLocale === locale} key={locale} />
        ))}
      </div>
    </SlideOutMenu>
  )
}
