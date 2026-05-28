import { Fragment } from 'react'
import { Flex, Text, TouchableTextLink, type ColorTokens, type TextProps, type TouchableTextLinkProps } from 'ui/src'
import { DISCLOSURES, type DisclosureLink as DisclosureLinkData } from 'uniswap/src/components/disclosures/disclosures'

type DisclosuresBodyProps = {
  variant?: TextProps['variant']
  color?: ColorTokens
  linkColor?: TouchableTextLinkProps['color']
  paragraphGap?: '$spacing8' | '$spacing12' | '$spacing16'
}

export function DisclosuresBody({
  variant = 'body3',
  color = '$neutral2',
  linkColor = '$accent1',
  paragraphGap = '$spacing12',
}: DisclosuresBodyProps): JSX.Element {
  return (
    <Flex gap={paragraphGap}>
      {DISCLOSURES.map((paragraph, paragraphIndex) => (
        <Text key={paragraphIndex} variant={variant} color={color}>
          {paragraph.map((node, nodeIndex) => {
            if (typeof node === 'string') {
              return <Fragment key={nodeIndex}>{node}</Fragment>
            }
            return <DisclosureLink key={nodeIndex} link={node} variant={variant} color={linkColor} />
          })}
        </Text>
      ))}
    </Flex>
  )
}

function DisclosureLink({
  link,
  variant,
  color,
}: {
  link: DisclosureLinkData
  variant: TextProps['variant']
  color: TouchableTextLinkProps['color']
}): JSX.Element {
  return (
    <TouchableTextLink
      onlyUseText
      link={link.href}
      color={color}
      variant={variant as TouchableTextLinkProps['variant']}
    >
      {link.text}
    </TouchableTextLink>
  )
}
