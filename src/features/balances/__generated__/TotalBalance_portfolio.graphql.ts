/**
 * @generated SignedSource<<ac0f291041979d6d8ed99184a3cc0fc9>>
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
    readonly value: number;
  };
  readonly " $fragmentType": "TotalBalance_portfolio";
} | null;
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
      "kind": "RequiredField",
      "field": {
        "alias": null,
        "args": null,
        "concreteType": "Amount",
        "kind": "LinkedField",
        "name": "tokensTotalDenominatedValue",
        "plural": false,
        "selections": [
          {
            "kind": "RequiredField",
            "field": {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "value",
              "storageKey": null
            },
            "action": "LOG",
            "path": "tokensTotalDenominatedValue.value"
          }
        ],
        "storageKey": null
      },
      "action": "LOG",
      "path": "tokensTotalDenominatedValue"
    }
  ],
  "type": "Portfolio",
  "abstractKey": null
};

(node as any).hash = "9423ec69b0c4b7b7ae1461592be4b5ef";

export default node;
