import { Link } from 'react-router'
import { GetHelpButtonUI } from 'uniswap/src/components/dialog/GetHelpButtonUI'
import type { GetHelpHeaderProps } from 'uniswap/src/components/dialog/GetHelpHeader'
import { type GetHelpButtonProps, GetHelpHeaderContent } from 'uniswap/src/components/dialog/GetHelpHeaderContent'
import { uniswapUrls } from 'uniswap/src/constants/urls'

function WebGetHelpButton({ url }: GetHelpButtonProps): JSX.Element {
  return (
    <Link to={url ?? uniswapUrls.helpUrl} style={{ textDecoration: 'none' }} target="_blank">
      <GetHelpButtonUI
        width="max-content"
        animation="fast"
        hoverStyle={{
          backgroundColor: '$surface3Hovered',
        }}
        $platform-web={{
          width: 'fit-content',
        }}
      />
    </Link>
  )
}

export function GetHelpHeader(props: GetHelpHeaderProps): JSX.Element {
  return <GetHelpHeaderContent {...props} GetHelpButton={WebGetHelpButton} backArrowHoverColor="$neutral2Hovered" />
}
