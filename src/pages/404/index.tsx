import { ThemedText } from 'theme'

export default function NotFound() {
  return (
    <>
      <ThemedText.Hero>404</ThemedText.Hero>
      <ThemedText.HeadlineLarge color="textSecondary">Page not found!</ThemedText.HeadlineLarge>
    </>
  )
}
