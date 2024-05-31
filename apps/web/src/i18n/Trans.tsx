import { useTranslation } from 'i18n/useTranslation'
import { Trans as OGTrans } from 'react-i18next'

export const Trans = ((props) => {
  // forces re-render on language change because it doesn't by default
  useTranslation()
  return <OGTrans {...props}>{props.children}</OGTrans>
}) satisfies typeof OGTrans
