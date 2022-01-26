import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { VoteOption } from './types';
interface ProposalDetail {
    target: string;
    functionSig: string;
    callData: string;
}
export interface ProposalData {
    id: string;
    title: string;
    description: string;
    proposer: string;
    status: ProposalState;
    forCount: number;
    againstCount: number;
    startBlock: number;
    endBlock: number;
    details: ProposalDetail[];
    governorIndex: number;
}
export interface CreateProposalData {
    targets: string[];
    values: string[];
    signatures: string[];
    calldatas: string[];
    description: string;
}
export declare enum ProposalState {
    UNDETERMINED = -1,
    PENDING = 0,
    ACTIVE = 1,
    CANCELED = 2,
    DEFEATED = 3,
    SUCCEEDED = 4,
    QUEUED = 5,
    EXPIRED = 6,
    EXECUTED = 7
}
export declare function useAllProposalData(): {
    data: ProposalData[];
    loading: boolean;
};
export declare function useProposalData(governorIndex: number, id: string): ProposalData | undefined;
export declare function useUserDelegatee(): string;
export declare function useUserVotes(): {
    loading: boolean;
    votes: CurrencyAmount<Token> | undefined;
};
export declare function useUserVotesAsOfBlock(block: number | undefined): CurrencyAmount<Token> | undefined;
export declare function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string>;
export declare function useVoteCallback(): {
    voteCallback: (proposalId: string | undefined, voteOption: VoteOption) => undefined | Promise<string>;
};
export declare function useCreateProposalCallback(): (createProposalData: CreateProposalData | undefined) => undefined | Promise<string>;
export declare function useLatestProposalId(address: string | undefined): string | undefined;
export declare function useProposalThreshold(): CurrencyAmount<Token> | undefined;
export {};
