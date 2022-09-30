import { ethNumberStandardFormatter, formatWeiToDecimal } from '../../../utils/currency'
import { putCommas } from '../../../utils/putCommas'
import { formatChange } from '../../../utils/toSignificant'
import { Box } from '../../Box'
import { Column, Row } from '../../Flex'
import { VerifiedIcon } from '../../icons'
import * as styles from './Cells.css'

interface CellProps {
  value: {
    logo?: string
    name?: string
    address?: string
    isVerified?: boolean
    value?: number
    change?: number
  }
}

export const CollectionTitleCell = ({ value }: CellProps) => {
  return (
    <Row as="span" style={{ marginLeft: '52px' }}>
      <img className={styles.logo} src={value.logo} alt={`${value.name} logo`} height={44} width={44} />
      <span className={styles.title}>{value.name}</span>
      {value.isVerified && (
        <span className={styles.verifiedBadge}>
          <VerifiedIcon />
        </span>
      )}
    </Row>
  )
}

export const WithCommaCell = ({ value }: CellProps) => <span>{value.value ? putCommas(value.value) : '-'}</span>

export const EthCell = ({ value }: { value: number }) => (
  <Row justifyContent="flex-end" color="textPrimary">
    {value ? <>{formatWeiToDecimal(value.toString(), true)} ETH</> : '-'}
  </Row>
)

export const VolumeCell = ({ value }: CellProps) => (
  <Row justifyContent="flex-end" color="textPrimary">
    {value.value ? <>{ethNumberStandardFormatter(value.value.toString())} ETH</> : '-'}
  </Row>
)

export const EthWithDayChange = ({ value }: CellProps) => (
  <Column gap="4">
    <VolumeCell value={{ value: value.value }} />
    {value.change ? (
      <Box
        as="span"
        color={value.change > 0 ? 'green' : 'accentFailure'}
        fontWeight="normal"
        fontSize="12"
        position="relative"
      >
        {value.change > 0 && '+'}
        {formatChange(value.change)}%
      </Box>
    ) : null}
  </Column>
)

export const WeiWithDayChange = ({ value }: CellProps) => (
  <Column gap="4">
    <Row justifyContent="flex-end" color="textPrimary">
      {value && value.value ? <>{formatWeiToDecimal(value.value.toString(), true)} ETH</> : '-'}
    </Row>
    {value.change ? (
      <Box
        as="span"
        color={value.change > 0 ? 'green' : 'accentFailure'}
        fontWeight="normal"
        fontSize="12"
        position="relative"
      >
        {value.change > 0 && '+'}
        {formatChange(value.change)}%
      </Box>
    ) : null}
  </Column>
)

export const CommaWithDayChange = ({ value }: CellProps) => (
  <Column gap="4">
    <WithCommaCell value={value} />
    {value.change ? (
      <Box
        as="span"
        color={value.change > 0 ? 'green' : 'accentFailure'}
        fontWeight="normal"
        fontSize="12"
        position="relative"
      >
        {value.change > 0 && '+'}
        {formatChange(value.change)}%
      </Box>
    ) : null}
  </Column>
)
