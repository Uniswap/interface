import styled from 'styled-components';

export const Table = styled.table`
  width: 100%;
  margin: 0;
  padding: 0;
`;

export const Th = styled.th<{align?: string}>`
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  text-transform: uppercase;
  text-align: ${({ align }) => align || 'left'};
  color: ${props => props.theme.bg5};
`;

