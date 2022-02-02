import { Info } from 'lib/icons'

export default function RoutingTooltip() {
  return <Info color="secondary" />
  /* TODO(zzmp): Implement post-beta launch.
  return (
    <Tooltip icon={Info} placement="bottom">
      <ThemeProvider>
        <ThemedText.Subhead2>TODO: Routing Tooltip</ThemedText.Subhead2>
      </ThemeProvider>
    </Tooltip>
  )
  */
}
