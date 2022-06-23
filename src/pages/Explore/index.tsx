import TokenTable from 'components/Explore/TokenTable'
import styled from 'styled-components/macro'
const GridContainer = styled.div`
  padding: 12px;
`

const Explore = () => {
  return (
    <>
      <GridContainer>
        <TokenTable />
      </GridContainer>
    </>
  )
}

export default Explore
