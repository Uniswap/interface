import { TouchableArea } from 'ui/src'
import { GetHelpButtonUI } from 'uniswap/src/components/dialog/GetHelpButtonUI'
import type { GetHelpHeaderProps } from 'uniswap/src/components/dialog/GetHelpHeader'
import { type GetHelpButtonProps, GetHelpHeaderContent } from 'uniswap/src/components/dialog/GetHelpHeaderContent'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'

function NativeGetHelpButton({ url }: GetHelpButtonProps): JSX.Element {
  const handlePress = async (): Promise<void> => {
    await openUri({ uri: url ?? uniswapUrls.helpUrl })
  }

  return (
    <TouchableArea onPress={handlePress}>
      <GetHelpButtonUI />
    </TouchableArea>
  )
}

export function GetHelpHeader(props: GetHelpHeaderProps): JSX.Element {
  return <GetHelpHeaderContent {...props} GetHelpButton={NativeGetHelpButton} />
}
