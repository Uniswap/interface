/// <reference types="react" />
import { VoteOption } from '../../state/governance/types';
interface VoteModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    voteOption: VoteOption | undefined;
    proposalId: string | undefined;
}
export default function VoteModal({ isOpen, onDismiss, proposalId, voteOption }: VoteModalProps): JSX.Element;
export {};
