export async function loadFlex(): Promise<unknown> {
  const ui = await import('ui/src')
  return ui.Flex
}
