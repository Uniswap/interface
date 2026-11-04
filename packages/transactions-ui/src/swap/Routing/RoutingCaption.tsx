import { Flex, Text } from '@universe/mycelium'
import { infoBodyTextVariant } from '@universe/transactions-ui/src/swap/infoBodyText'
import {
  type InfoContainer,
  type RoutingCaptionDisplay,
  RoutingCaptionKind,
} from '@universe/transactions-ui/src/swap/types'
import { useTranslation } from 'react-i18next'

export interface RoutingCaptionProps {
  container: InfoContainer
  caption: RoutingCaptionDisplay
}

export function RoutingCaption({ container, caption }: RoutingCaptionProps): JSX.Element {
  const { t } = useTranslation()
  const textVariant = infoBodyTextVariant(container)
  const textAlign = container === 'tooltip' ? 'left' : 'center'

  if (caption.kind === RoutingCaptionKind.UniswapX) {
    return (
      <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
        {caption.content}
      </Text>
    )
  }

  if (caption.kind === RoutingCaptionKind.Diagram) {
    return (
      <Flex gap="$spacing12">
        {caption.diagram}
        {caption.descriptionText && (
          <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
            {caption.descriptionText}
          </Text>
        )}
      </Flex>
    )
  }

  return (
    <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
      {t('swap.routing.poolsAndVersions', { count: caption.pools, versions: caption.versions.join(', ') })}
    </Text>
  )
}
