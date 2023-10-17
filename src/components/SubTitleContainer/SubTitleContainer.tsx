import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const TitleContainer = styled.div`
  /* margin-bottom: 32px; */
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`

export default function SubTitleContainer({ text, description }: { text: string; description: string }) {
  return (
    <TitleContainer>
      <MouseoverTooltip text={<div>{text}</div>} placement="bottom">
        <ThemedText.SubHeaderSmall>
          <div>{description}</div>
        </ThemedText.SubHeaderSmall>
      </MouseoverTooltip>
    </TitleContainer>
  )
}
