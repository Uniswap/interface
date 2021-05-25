import React from 'react'
import styled from 'styled-components';
import TriangleIcon from '../../assets/svg/triangle.svg';
import { RowBetween } from '../../components/Row';
import { TagSuccess } from '../../components/Tag';

const Section = styled.button`
  width: 100%;
  padding: 12px 19px 15px;
  background: ${({ theme }) => theme.bg1And2};
  border-radius: 12px;
  border: none;
  text-align: left;
  cursor: pointer;
`;

const SmallLabel = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.purple2};
`

const Row = styled(RowBetween)`
  align-items: flex-start;
`;

const IconWrapper = styled(RowBetween)`
  min-height: 36px;
  max-width: 36px;
  margin-bottom: 12px;

  img {
    max-width: 100%;
  }
`;

const AssetName = styled.p`
  position: relative;
  display: inline-block;
  padding-right: 20px;
  margin: 5px 0 0;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text2};

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background: url(${TriangleIcon}) center no-repeat;
    background-size: contain;
  }
`;

interface AssetSelectorProps {
  label: string;
  icon: string;
  name: string;
  connected?: boolean
}

export const AssetSelector = ({label, icon, name, connected}: AssetSelectorProps) => {
  return (
    <Section>
      <Row>
        <IconWrapper>
          <img src={icon} alt={name} />
        </IconWrapper>
        {connected && <TagSuccess>Connected</TagSuccess>}
      </Row>
      <SmallLabel>{label}</SmallLabel>
      <AssetName>{name}</AssetName>
    </Section>
  )
}
