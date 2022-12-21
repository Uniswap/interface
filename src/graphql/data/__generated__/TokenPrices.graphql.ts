/**
 * @generated SignedSource<<071e70e6ca476111d937315f95e6050f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TokenPrices$data = {
  readonly priceHistory: ReadonlyArray<{
    readonly timestamp: number;
    readonly value: number | null;
  } | null> | null;
  readonly " $fragmentType": "TokenPrices";
};
export type TokenPrices$key = {
  readonly " $data"?: TokenPrices$data;
  readonly " $fragmentSpreads": FragmentRefs<"TokenPrices">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [
    {
      "kind": "RootArgument",
      "name": "duration"
    }
  ],
  "kind": "Fragment",
  "metadata": null,
  "name": "TokenPrices",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Variable",
          "name": "duration",
          "variableName": "duration"
        }
      ],
      "concreteType": "TimestampedAmount",
      "kind": "LinkedField",
      "name": "priceHistory",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "timestamp",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "value",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "TokenProjectMarket",
  "abstractKey": null
};

(node as any).hash = "048721d5a84c36a0e681e44e03ce78e7";

export default node;
