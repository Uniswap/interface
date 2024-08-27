import { Trans as OGTrans, useTranslation } from 'react-i18next'

export const Trans = ((props): JSX.Element => {
  // forces re-render on language change because it doesn't by default
  useTranslation()

  return <OGTrans {...props}>{props.children}</OGTrans>
}) satisfies typeof OGTrans
