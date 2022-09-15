import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/layout/Radio.css'
import { MouseEvent } from 'react'

interface RadioProps {
  hovered: boolean
  checked: boolean
  onClick: (e: MouseEvent) => void
}

export const Radio = ({ hovered, checked, onClick }: RadioProps) => {
  return (
    <Box
      as="label"
      className={checked ? styles.selectedRadio : hovered ? styles.blueBorderRadio : styles.greyBorderRadio}
      onClick={onClick}
    />
  )
}

Radio.displayName = 'Radio'
