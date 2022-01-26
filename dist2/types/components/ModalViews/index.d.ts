/// <reference types="react" />
export declare function LoadingView({ children, onDismiss }: {
    children: any;
    onDismiss: () => void;
}): JSX.Element;
export declare function SubmittedView({ children, onDismiss, hash, }: {
    children: any;
    onDismiss: () => void;
    hash: string | undefined;
}): JSX.Element;
