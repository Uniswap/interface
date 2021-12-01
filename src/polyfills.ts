import 'polyfill-object.fromentries'

import flat from 'array.prototype.flat'
import flatMap from 'array.prototype.flatmap'

flat.shim()
flatMap.shim()
