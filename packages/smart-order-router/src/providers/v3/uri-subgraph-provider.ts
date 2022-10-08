import { URISubgraphProvider } from '../uri-subgraph-provider';

import { IV3SubgraphProvider, V3SubgraphPool } from './subgraph-provider';

export class V3URISubgraphProvider
  extends URISubgraphProvider<V3SubgraphPool>
  implements IV3SubgraphProvider {}
