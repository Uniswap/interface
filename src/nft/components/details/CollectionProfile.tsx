import { badge, subheadSmall } from '../../css/common.css'
import { Box, BoxProps } from '../Box'
import { Row } from '../Flex'
import { VerifiedIcon } from '../icons'

export const CollectionProfile = ({
  label,
  isVerified,
  name,
  avatarUrl,
  ...props
}: {
  isVerified?: boolean
  label: string
  name: string
  avatarUrl: string
} & BoxProps) => {
  return (
    <Row {...props}>
      {avatarUrl ? (
        <Box as="img" src={avatarUrl} height="36" width="36" marginRight="12" borderRadius="round" />
      ) : (
        <Box role="img" background="fallbackGradient" height="36" width="36" marginRight="12" borderRadius="round" />
      )}
      <div>
        <Box as="span" color="textSecondary" style={{ textTransform: 'uppercase' }} className={badge}>
          {label}
        </Box>
        <Row marginTop="4" className={subheadSmall} color="textPrimary">
          {name} {isVerified && <VerifiedIcon />}
        </Row>
      </div>
    </Row>
  )
}
