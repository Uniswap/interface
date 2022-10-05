/**
 * @generated SignedSource<<b00843973d40d4cd028136c2f09e77d5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TotalBalance_portfolio$data = {
  readonly tokensTotalDenominatedValue: {
    readonly value: number | null;
  } | null;
  readonly " $fragmentType": "TotalBalance_portfolio";
};
export type TotalBalance_portfolio$key = {
  readonly " $data"?: TotalBalance_portfolio$data;
  readonly " $fragmentSpreads": FragmentRefs<"TotalBalance_portfolio">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TotalBalance_portfolio",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Amount",
      "kind": "LinkedField",
      "name": "tokensTotalDenominatedValue",
      "plural": false,
      "selections": [
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
  "type": "Portfolio",
  "abstractKey": null
};

(node as any).hash = "7f2a9e7f870aba5bd8ec65c8e0cdc8cc";

export default node;
