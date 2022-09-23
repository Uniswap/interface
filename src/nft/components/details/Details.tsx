import { bodySmall } from '../../css/common.css'
import { shortenAddress } from '../../utils/address'
import { Box, BoxProps } from '../Box'
import { Column, Row } from '../Flex'

const DetailItemLabel = (props: BoxProps) => <Box as="span" fontSize="14" color="textSecondary" {...props} />

const DetailItemValue = (props: BoxProps) => (
  <Box as="span" fontSize="14" marginLeft="4" color="textPrimary" {...props} />
)

const Detail = (props: BoxProps) => (
  <Row justifyContent="space-between" width="full" style={{ minWidth: '224px' }} {...props} />
)

export const Details = ({
  contractAddress,
  tokenId,
  metadataUrl,
  tokenType,
  totalSupply,
  blockchain,
}: {
  contractAddress: string
  tokenId: string
  metadataUrl: string
  tokenType: string
  totalSupply: number
  blockchain: string
}) => (
  <Row gap={{ md: '32', sm: '16' }} width="full" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap">
    <Column width={{ sm: 'full', md: 'auto' }} gap="10">
      <Detail>
        <DetailItemLabel>Contract Address: </DetailItemLabel>
        <a
          href={`https://etherscan.io/token/${contractAddress}`}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <DetailItemValue>{shortenAddress(contractAddress)}</DetailItemValue>
        </a>
      </Detail>
      <Detail>
        <DetailItemLabel>Token ID:</DetailItemLabel>
        <DetailItemValue className={bodySmall}>{tokenId}</DetailItemValue>
      </Detail>
      {metadataUrl ? (
        <Detail>
          <DetailItemLabel>Metadata:</DetailItemLabel>
          <a href={metadataUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <DetailItemValue>{metadataUrl.slice(0, 12)}...</DetailItemValue>
          </a>
        </Detail>
      ) : null}
    </Column>

    <Column width={{ sm: 'full', md: 'auto' }} gap="10">
      <Detail>
        <DetailItemLabel>Contract type:</DetailItemLabel>
        <DetailItemValue>{tokenType}</DetailItemValue>
      </Detail>
      <Detail>
        <DetailItemLabel>Total supply:</DetailItemLabel>
        <DetailItemValue>{totalSupply}</DetailItemValue>
      </Detail>
      <Detail>
        <DetailItemLabel>Blockchain:</DetailItemLabel>
        <DetailItemValue>{blockchain}</DetailItemValue>
      </Detail>
    </Column>
  </Row>
)
