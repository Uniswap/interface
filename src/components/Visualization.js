import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { subscribe } from 'redux-subscriber'
import * as d3 from 'd3';
import axios from 'axios';

class Visualization extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    }
  }
  // TODO: find a way to get this thing to listen for changes in the output token
  componentDidMount() {
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));

    let inputToken = this.props.exchange.inputToken.value;
    let outputToken = this.props.exchange.outputToken.value;
    console.log(outputToken, 'output token');

    let query = `{
      Event(input:"${outputToken}"){
        ethValueOfToken
        createdAt
      }
    }`;

    console.log(query, 'query')

    axios.get('http://ec2-34-193-175-237.compute-1.amazonaws.com:3000/graphql', { params: {query: query } })
    .then(data => this.setState({data: data.data.data.Event }))
    .then(() => this.createLineGraph())
    .catch(err => console.error(err));

    this.outputTokenSubscriber();
  }

  outputTokenSubscriber() {
    const outputTokenSubscriber = subscribe('exchange.outputToken', state => {
      let outputToken = state.exchange.outputToken.value;
      console.log('outputToken change deteced', outputToken)

      let query = `{
        Event(input:"${outputToken}"){
          ethValueOfToken
          createdAt
        }
      }`;

      axios.get('http://ec2-34-193-175-237.compute-1.amazonaws.com:3000/graphql', { params: { query: query }})
      .then(data => this.setState({data: data.data.data.Event}))
      .then(() => {
        this.createNewLineGraph()
      })
      .catch(err => console.error(err));
    })
  }

  createLineGraph() {
    // TODO: as you change whether you want to see days or years, change the extent
    // scales are wicked important
    let margin = {top: 20, bottom:20, left:20, right:20}
    let width = 1039 - margin.left - margin.right;
    let height = 325 - margin.top - margin.bottom;
    let svg = this.d3Graph
    // first we want to see the min and max of our token prices
    let ethValueOfTokenExtent = d3.extent(this.state.data, element => element.ethValueOfToken);
    console.log('initial data visualized', this.state.data, 'extent of data', ethValueOfTokenExtent)
    // create a y scale, for the eth value of the token
    let yScale = d3.scaleLinear()
      .domain([ethValueOfTokenExtent[1], ethValueOfTokenExtent[0]])
      .range([margin.bottom, height - margin.top]);

    // now that we have the scale, we create the actual axis
    let yAxis = d3.axisLeft()
      .scale(yScale)
      .ticks(8)
 
    // time to put this y axis on the page
    svg.append('g')
     .attr('class', 'y axis')
     .attr('transform', 'translate(100)')
     .call(yAxis);

    // sanitize the data for the x-axis
    this.state.data.map(e => e.createdAt = new Date(e.createdAt));
    // similarly, check the min and max of our times
    let timeExtent = d3.extent(this.state.data, element => element.createdAt)
    console.log('previous time extent', timeExtent)
    // with this extent, create a scale for the x axis
    // BIG NOTE: for timeScales, you need to create new Date objects from the date string
    // also, domain needs to take in an array
    let xScale = d3.scaleTime()
      .domain(timeExtent)
      .range([margin.left, width - margin.right]);
    // we have a scale, lets create the axis
    let xAxis = d3.axisBottom()
      .scale(xScale);
    // append the axis to the DOM, make sure it's positioned correctly
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(80, 265)')
      .call(xAxis);
    // this right here is the x-axis label 
    svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("y", 20 )
     .attr("x", 0 - (height / 2))
     .attr("dy", "1em")
     .attr('font-size', '15px')
     .style("text-anchor", "middle")
     .text("Price (ETH)");
    
    let line = d3.line()
      .x(element => xScale(element.createdAt))
      .y(element => yScale(element.ethValueOfToken))

    svg.append('path')
      .datum(this.state.data)
      .attr('d', line)
      .attr('class', 'line')
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 2.5)
      .attr('transform', 'translate(80)')
  }

  createNewLineGraph() {
    let margin = {top: 20, bottom:20, left:20, right:20}
    let width = 1039 - margin.left - margin.right;
    let height = 325 - margin.top - margin.bottom;
    this.state.data.map(e => e.createdAt = new Date(e.createdAt));
    console.log('data is being set correctly', this.state.data)
    // we set the range of the data again
    let yExtent = d3.extent(this.state.data, e => e.ethValueOfToken);
    let xExtent = d3.extent(this.state.data, e => e.createdAt);
    console.log('new yExtent', yExtent)
    console.log('new xExtent', xExtent)
    // we also redefine the scales for the new data
    let yScale = d3.scaleLinear()
      .domain([yExtent[1], yExtent[0]])
      .range([margin.bottom, height - margin.top]);
    let xScale = d3.scaleTime()
      .domain(xExtent)
      .range([margin.left, width - margin.right]);
    // redefine the axes
    let xAxis = d3.axisBottom()
      .scale(xScale)
    let yAxis = d3.axisLeft()
      .scale(yScale)
      .ticks(8)

    let svg = this.d3Graph.transition()
    let line = d3.line()
      .x(element => xScale(element.createdAt))
      .y(element => yScale(element.ethValueOfToken))

    svg.select('.line')
      .duration(750)
      .attr('d', line(this.state.data))
    svg.select('.x.axis')
      .duration(750)
      .call(xAxis)
    svg.select('.y.axis')
      .duration(750)
      .call(yAxis)
  }

  render () {
    const width = 1039;
    const height = 375;
    return (
      <div align="center">
        <svg width={width} height={height}>
          <g ref="graph"/>
        </svg>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  exchange: state.exchange
})

export default connect (mapStateToProps)(Visualization);

// input and output tokens will have to be considered for this to work correctly
// we'll start by pulling the output token
// potential problem that these data points are not being written at the exact same time
// we will deal with that when we get there
