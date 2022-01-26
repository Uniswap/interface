/// <reference types="react" />
export declare enum ProposalAction {
    TRANSFER_TOKEN = "Transfer Token",
    APPROVE_TOKEN = "Approve Token"
}
interface ProposalActionSelectorModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    onProposalActionSelect: (proposalAction: ProposalAction) => void;
}
export declare const ProposalActionSelector: ({ className, onClick, proposalAction, }: {
    className?: string | undefined;
    onClick: () => void;
    proposalAction: ProposalAction;
}) => JSX.Element;
export declare function ProposalActionSelectorModal({ isOpen, onDismiss, onProposalActionSelect, }: ProposalActionSelectorModalProps): JSX.Element;
export {};
