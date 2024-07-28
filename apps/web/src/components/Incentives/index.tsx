import React from 'react';
import styled from 'styled-components';
import { Trans } from 'i18n'

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
    poolName: 'AZUR/WETH',
    poolPercent: '0.3%',
    status: 'active',
    startDate: '19/JUN/2024 13:00',
    endDate: '19/SEP/2024 13:00',
    vestingPeriod: '30 days',
    poolTVL: '$1,000,000',
    totalProgramRewards: '600,000 AZUR',
    totalDollars: 'approx $50,000',
    tokenReward: 'AZUR',
  },
  {
    poolName: 'WETH/LAKE',
    poolPercent: '0.3%',
    status: 'active',
    startDate: '19/JUN/2024 13:00',
    endDate: '19/JUN/2024 13:00',
    vestingPeriod: '30 days',
    poolTVL: '$1,000,000',
    totalProgramRewards: '600,000 LAKE',
    totalDollars: 'approx $50,000',
    tokenReward: 'LAKE',
  },
  {
    poolName: 'WMINIMA/USDT',
    poolPercent: '0.3%',
    status: 'active',
    startDate: '19/JUN/2024 13:00',
    endDate: '19/JUN/2024 13:00',
    vestingPeriod: '30 days',
    poolTVL: '$1,000,000',
    totalProgramRewards: '600,000 WMINIMA',
    totalDollars: 'approx $50,000',
    tokenReward: 'WMINIMA',
  },
  {
    poolName: 'LINK/SDL',
    poolPercent: '0.3%',
    status: 'active',
    startDate: '19/JUN/2024 13:00',
    endDate: '19/JUN/2024 13:00',
    vestingPeriod: '30 days',
    poolTVL: '$1,000,000',
    totalProgramRewards: '600,000 SDL',
    totalDollars: 'approx $50,000',
    tokenReward: 'SDL',
  },
  {
    poolName: 'TKB/WETH',
    poolPercent: '0.3%',
    status: 'active',
    startDate: '19/JUN/2024 13:00',
    endDate: '19/JUN/2024 13:00',
    vestingPeriod: '30 days',
    poolTVL: '$1,000,000',
    totalProgramRewards: '600,000 TKB',
    totalDollars: 'approx $50,000',
    tokenReward: 'TKB',
  },

];

const Incentives = () => {
  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <th><Trans i18nKey="common.incentives.pool.fee" /></th>
            <th><Trans i18nKey="common.incentives.duration" /></th>
            <th><Trans i18nKey="common.incentives.vesting.period" /></th>
            <th><Trans i18nKey="common.incentives.pool.tv1" /></th>
            <th><Trans i18nKey="common.incentives.total.program.rewards" /></th>
            <th><Trans i18nKey="common.incentives.token.reward" /></th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((data, index) => (
            <tr key={index}>
              <td>{data.poolName} {data.poolPercent} <br /> {data.status}</td>
              <td>{data.startDate} <br /> {data.endDate}</td>
              <td>{data.poolTVL}</td>
              <td>{data.vestingPeriod}</td>
              <td>{data.totalProgramRewards} <br /> {data.totalDollars}</td>
              <td>{data.tokenReward}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default Incentives;
