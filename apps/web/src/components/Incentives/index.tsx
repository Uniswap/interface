import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.neutral3};
  }
  th {
    font-weight: bold;
  }
`;

const mockData = [
  {
    poolFeeTier: '0.3%',
    durationUTC: '2024-07-01 12:00',
    vestingPeriod: '30 days',
    poolTVL: '$1,000,000',
    totalProgramRewards: '$50,000',
    tokenReward: '500 TOKEN',
  },
  {
    poolFeeTier: '0.5%',
    durationUTC: '2024-07-02 12:00',
    vestingPeriod: '60 days',
    poolTVL: '$2,000,000',
    totalProgramRewards: '$100,000',
    tokenReward: '1000 TOKEN',
  },
  // Add more mocked data as needed
];

const Incentives = () => {
  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <th>Pool/Fee Tier</th>
            <th>Duration (UTC Time)</th>
            <th>Vesting Period</th>
            <th>Pool TVL</th>
            <th>Total Program Rewards</th>
            <th>Token Reward</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((data, index) => (
            <tr key={index}>
              <td>{data.poolFeeTier}</td>
              <td>{data.durationUTC}</td>
              <td>{data.vestingPeriod}</td>
              <td>{data.poolTVL}</td>
              <td>{data.totalProgramRewards}</td>
              <td>{data.tokenReward}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default Incentives;
