import { Link } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Card, Circle, H1, H2, Paragraph, Stack } from 'tamagui'

export function IntroScreen() {
  const { t } = useTranslation()

  return (
    <Card backgroundColor={'$background0'} alignItems="center" width={600}>
      <Card.Header alignItems="center">
        <Circle width={60} height={60} backgroundColor="$brandedAccentSoft" />
        <H2>{t('Say hello to your new wallet')}</H2>
      </Card.Header>

      <Paragraph>
        {t('It has a public address for making transactions, and a nickname that’s only visible to you.')}
      </Paragraph>

      <Stack backgroundColor="$background3">
        <H1>{t('My wallet')}</H1>
      </Stack>
      <Link to={{ screen: 'home' }}>{t('Continue')}</Link>

      <Card.Footer></Card.Footer>

      <Card.Background></Card.Background>
    </Card>
  )
}
