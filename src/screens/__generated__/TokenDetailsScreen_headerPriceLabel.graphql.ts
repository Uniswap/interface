/**
 * @generated SignedSource<<56a5c2425e3cc0d79a7d6c6c71082f89>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TokenDetailsScreen_headerPriceLabel$data = {
  readonly markets: ReadonlyArray<{
    readonly price: {
      readonly value: number;
    } | null;
  } | null> | null;
  readonly " $fragmentType": "TokenDetailsScreen_headerPriceLabel";
};
export type TokenDetailsScreen_headerPriceLabel$key = {
  readonly " $data"?: TokenDetailsScreen_headerPriceLabel$data;
  readonly " $fragmentSpreads": FragmentRefs<"TokenDetailsScreen_headerPriceLabel">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TokenDetailsScreen_headerPriceLabel",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Literal",
          "name": "currencies",
          "value": [
            "USD"
          ]
        }
      ],
      "concreteType": "TokenProjectMarket",
      "kind": "LinkedField",
      "name": "markets",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Amount",
          "kind": "LinkedField",
          "name": "price",
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
      "storageKey": "markets(currencies:[\"USD\"])"
    }
  ],
  "type": "TokenProject",
  "abstractKey": null
};

(node as any).hash = "74b37edf5f77d2ae679f856aee690e27";

export default node;
