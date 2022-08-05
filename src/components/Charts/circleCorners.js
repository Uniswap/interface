/* THIS FILE IS FROM A NON-TYPESCRIPT LIBRARY THAT WOULDN'T IMPORT PROPERLY
  https://www.npmjs.com/package/d3-curve-circlecorners?activeTab=readme

  It is the only package I could find that allows you to make d3 shapes with straight lines but still have rounded corners (instead of sharp edges)
  All other packages or builtin visx/d3 curve functions make the entire line curvy rather than just corners
*/

/**
 * Point type definition
 * @typedef {Object} Point
 * @property {number} x - horizontal position in a canvas or SVG element
 * @property {number} y - vertical position in a canvas or SVG element
 */

/**
 * CircleCorners type definition
 * @typedef {Object} CircleCorners
 * @property {function} areaStart - triggered when ...
 * @property {function} areaEnd   - triggered when ...
 * @property {function} lineStart - triggered when before the first datum in a line
 * @property {function} lineEnd   - triggered when after the last datum in a line
 * @property {function} point     - triggered for each point in an array of data defining a line
 * @property {object}   _context  - 2d context of an HTML canvas element (or equivalant SVG drawing space)
 * @property {string}   _context._  draw commands to be applied to the d attribute of a path element
 * @property {number}   _radius   - corner radius to apply to each line segment intersection
 * @property {number}   [_line]   - state variable for ...
 * @property {number}   [_point]  - state variable for how many points are saved as properties (vert & prev)
 * @property {Point}    [_prev]   - the point preceding the vertex; either the first point of a line or an "out" anchor
 * @property {Point}    [_vert]   - vertex currently being drawn; the curve will not actually touch this point
 */

function CircleCorners(context, radius) {
  this._context = context
  this._radius = radius
}

/**
 * @func   alongSegment
 * @desc   locatates a point a certain disatance away, in the direction of a known position
 * @param  {Point}  from - origin of a ray (or vector)
 * @param  {Point}  from - second point defining the direction of the ray (or vector)
 * @param  {number} distanceAlong - distance away that the output point should be, along the ray
 * @return {Point}  a new point, the specified direction and distance from `from`
 */
function alongSegment(from, toward, distanceAlong) {
  const rayAngle = Math.atan2(from.y - toward.y, from.x - toward.x)

  return {
    x: from.x - distanceAlong * Math.cos(rayAngle),
    y: from.y - distanceAlong * Math.sin(rayAngle),
  }
}

/**
 * @func   arcPast
 * @desc   ...
 * @param  {Object} that - context of the current draw command
 * @param  {number} x    - ...
 * @param  {number} y    - ...
 */
function arcPast(that, x, y) {
  // TO DO: Allow that._radius to be a number or an array of numbers (one for each point, with first and last ignored)

  const angle = Math.abs(
    Math.atan2(that._vert.y - that._prev.y, that._vert.x - that._prev.x) -
      Math.atan2(that._vert.y - y, that._vert.x - x)
  )
  const acuteAngle = angle > Math.PI ? 2 * Math.PI - angle : angle
  const shortestRay = Math.min(
    Math.sqrt(Math.pow(that._vert.x - that._prev.x, 2) + Math.pow(that._vert.y - that._prev.y, 2)),
    Math.sqrt(Math.pow(that._vert.x - x, 2) + Math.pow(that._vert.y - y, 2))
  )
  const radius = Math.min(that._radius, shortestRay * Math.tan(acuteAngle / 2))
  const anchorDistance = Math.abs(radius / Math.tan(acuteAngle / 2))
  const determinant =
    (that._vert.x - that._prev.x) * (that._vert.y - y) - (that._vert.x - x) * (that._vert.y - that._prev.y)
  const sweepFlag = determinant < 0 ? 1 : 0

  const aIn = alongSegment(that._vert, that._prev, anchorDistance)
  const aOut = alongSegment(that._vert, { x, y }, anchorDistance)

  // that._context.arcTo() doesn't work properly, so we'll modify the string directly
  that._context._ += ` L${aIn.x} ${aIn.y} A${radius} ${radius} 0 0 ${sweepFlag} ${aOut.x} ${aOut.y}`

  that._prev = aOut
  that._vert = { x, y }
}

CircleCorners.prototype = {
  areaStart() {
    this._line = 0
  },
  areaEnd() {
    this._line = NaN
  },
  lineStart() {
    this._prev = { x: NaN, y: NaN }
    this._vert = { x: NaN, y: NaN }
    this._point = 0
  },
  lineEnd() {
    // No more points, so draw a straight line to the end
    this._context.lineTo(this._vert.x, this._vert.y)

    // proceed
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath()
    this._line = 1 - this._line
  },
  point(x, y) {
    x = +x
    y = +y

    switch (this._point) {
      case 0:
        this._point = 1
        break

      case 1:
        this._point = 2
        if (this._line) {
          this._context.lineTo(this._vert.x, this._vert.y)
        } else {
          this._context.moveTo(this._vert.x, this._vert.y)
        }
        break

      default:
        arcPast(this, x, y)
        return
    }

    this._prev = this._vert
    this._vert = { x, y }
  },
}

export default (function custom(radius) {
  function circleCorners(context) {
    return new CircleCorners(context, radius)
  }

  circleCorners.radius = function (radius) {
    return custom(+radius)
  }

  return circleCorners
})(0)
