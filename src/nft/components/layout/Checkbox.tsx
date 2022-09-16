import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { ApprovedCheckmarkIcon } from 'nft/components/icons'
import React from 'react'

import * as styles from './Checkbox.css'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hovered: boolean
  children: React.ReactNode
}

export const Checkbox: React.FC<CheckboxProps> = ({ hovered, children, ...props }: CheckboxProps) => {
  return (
    <Box
      as="label"
      display="flex"
      alignItems="center"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      lineHeight="1"
    >
      {children}
      <Box
        as="span"
        borderColor={props.checked || hovered ? 'blue400' : 'grey400'}
        className={styles.checkbox}
        // This element is purely decorative so
        // we hide it for screen readers
        aria-hidden="true"
      />
      <input {...props} className={styles.input} type="checkbox" />
      <ApprovedCheckmarkIcon className={clsx(styles.checkMark, props.checked && styles.checkMarkActive)} />
    </Box>
  )
}
