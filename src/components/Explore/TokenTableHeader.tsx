import styled from 'styled-components/macro'

const HeaderRow = styled.div`
  width: 100%;
  height: 60px;
  display: grid;
  grid-template-columns: 40px 32px 200px 107.5px 107.5px 107.5px 107.5px 172px 62px;
  padding: 0px 12px 0px 12px;
  height: 48px;
  color: ${({ theme }) => theme.text2};
  font-size: 12px;
  line-height: 16px;
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.bg3};
`

const NameContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14px 8px;
  gap: 8px;

  width: 200px;
  height: 60px;
`
const PriceContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;

  width: 107.5px;
  height: 60px;
`
const PercentChangeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding: 14px 8px;
  gap: 10px;

  width: 107.5px;
  height: 60px;
`

const MarketCapContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;

  width: 107.5px;
`
const VolumeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 8px;
  gap: 10px;

  width: 107.5px;
`

export default function Header(props: any) {
  return (
    <HeaderRow>
      <div></div>
      <div></div>
      <NameContainer>Name</NameContainer>
      <PriceContainer>Price</PriceContainer>
      <PercentChangeContainer>% Change</PercentChangeContainer>
      <MarketCapContainer>Market Cap</MarketCapContainer>
      <VolumeContainer>1D Volume</VolumeContainer>
    </HeaderRow>
  )
}
