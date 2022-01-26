import { Pool, Position } from '@uniswap/v3-sdk';
import { PositionDetails } from 'types/position';
export declare function useDerivedPositionInfo(positionDetails: PositionDetails | undefined): {
    position: Position | undefined;
    pool: Pool | undefined;
};
