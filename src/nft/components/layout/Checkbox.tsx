import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { ApprovedCheckmarkIcon } from 'nft/components/icons'
import { ChangeEvent } from 'react'

import * as styles from './Checkbox.css'

interface CheckboxProps {
  checked: boolean
  hovered: boolean
  children: React.ReactNode
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export const Checkbox = ({ onChange, children, checked, hovered, ...props }: CheckboxProps) => {
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
      <span
        className={clsx(styles.checkbox, checked ? styles.checkboxActive : '', hovered && styles.checkboxActive)}
        // This element is purely decorative so
        // we hide it for screen readers
        aria-hidden="true"
      />
      <input
        {...props}
        className={styles.input}
        type="checkbox"
        onChange={(e) => {
          onChange(e)
        }}
      />
      <ApprovedCheckmarkIcon className={clsx(styles.checkMark, checked ? styles.checkMarkActive : '')} />
    </Box>
  )
}
