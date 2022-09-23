import clsx from 'clsx'
import { useState } from 'react'

import { Box, BoxProps } from '../Box'
import * as styles from './ExpandableText.css'

const RevealButton = (props: BoxProps) => (
  <Box
    as="button"
    display="inline"
    fontWeight="bold"
    border="none"
    fontSize="14"
    color="textSecondary"
    padding="0"
    background="transparent"
    {...props}
  />
)

export const ExpandableText = ({ children, ...props }: BoxProps) => {
  const [isExpanded, setExpanded] = useState(false)

  return (
    <Box
      display="flex"
      flexDirection={isExpanded ? 'column' : 'row'}
      alignItems={isExpanded ? 'flex-start' : 'flex-end'}
      justifyContent="flex-start"
      fontSize="14"
      color="textSecondary"
      marginTop="0"
      marginBottom="20"
      {...props}
    >
      <span className={clsx(styles.span, !isExpanded && styles.hiddenText)}>
        {children}{' '}
        {isExpanded ? (
          <RevealButton marginTop={isExpanded ? '8' : 'unset'} onClick={() => setExpanded(!isExpanded)}>
            Show less
          </RevealButton>
        ) : (
          <RevealButton onClick={() => setExpanded(!isExpanded)}>Show more</RevealButton>
        )}
      </span>
    </Box>
  )
}
