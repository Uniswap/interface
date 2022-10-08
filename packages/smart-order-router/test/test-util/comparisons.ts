import { Pool } from '@uniswap/v3-sdk';
import _ from 'lodash';

export const poolEquals = (p1: Pool, p2: Pool) =>
  Pool.getAddress(p1.token0, p1.token1, p1.fee) ==
  Pool.getAddress(p2.token0, p2.token1, p2.fee);

export const poolsContain = (pools: Pool[], pool: Pool) => {
  const addresses = _.map(pools, (p) =>
    Pool.getAddress(p.token0, p.token1, p.fee)
  );
  return _.includes(
    addresses,
    Pool.getAddress(pool.token0, pool.token1, pool.fee)
  );
};
