import clsx from 'clsx'
import * as styles from 'nft/components/layout/Radio.css'
import { ChangeEvent } from 'react'

interface RadioProps {
  hovered: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export const Radio = ({ onChange, hovered, ...props }: RadioProps & React.HTMLProps<HTMLInputElement>) => {
  return (
    <label className={styles.container}>
      <input
        className={styles.input}
        type="checkbox"
        onChange={(e) => {
          onChange(e)
        }}
        {...props}
      />
      <span className={clsx(styles.radio, hovered && styles.radioHovered)}></span>
    </label>
  )
}

Radio.displayName = 'Radio'
