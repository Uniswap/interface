/// <reference types="react" />
import { PopupContent } from '../../state/application/reducer';
export default function PopupItem({ removeAfterMs, content, popKey, }: {
    removeAfterMs: number | null;
    content: PopupContent;
    popKey: string;
}): JSX.Element;
