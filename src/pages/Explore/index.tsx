import TimeSelector from 'components/Explore/TimeSelector'
import styled from 'styled-components/macro'
const GridContainer = styled.div`
  padding: 12px;
`

const Explore = () => {
  return (
    <>
      <GridContainer>
        <TimeSelector />
      </GridContainer>
    </>
  )
}

export default Explore
