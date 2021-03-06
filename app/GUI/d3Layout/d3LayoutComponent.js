/* global ga */

import React, { Component } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

import { radialLine, bundle } from 'd3-shape';
import d3 from 'd3';

import { packageHierarchy, packageImports } from './helpers/structure';
const classes = require('./data/data.js');

import LinkPath from './elements/linkPath';
import NodeElement from './elements/nodeElement';

export default class d3LayoutComponent extends Component {
  constructor() {
    super();
    this.state = {
      tension: 0.85,
      rotationPlus: 0,
      activeNode: '',
      size: 1000,
      lines: [],
      nodes: [],
    };
  }

  componentDidMount() {
    // prepare some things before the rendering starts...

    const { size } = this.state;
    const radius = size / 2;
    const innerRadius = radius * 0.75;

    const myBundle = d3.layout.bundle(); // shamelessly d3.v3
    const cluster = d3.layout.cluster() // and again, d3.v3
      .size([360, innerRadius])
      .sort(null)
      .value(d => d.size);

    const nodes = cluster.nodes(packageHierarchy(classes))
      .filter(n => !n.children);
    const links = packageImports(nodes);

    const lines = myBundle(links);

    lines.map(l => {
      l.source = l[0]; // UGLY
      l.target = l[l.length - 1]; // UGLY
    });

    this.cdmSetState(lines, nodes);
  }

  cdmSetState(lines, nodes) {
    this.setState({
      lines,
      nodes,
    });
  }

  render() {
    const { tension, activeNode, size, lines, nodes, rotationPlus } = this.state;
    const radius = size / 2;
    const lineGenerator = radialLine()
      .curve(bundle, tension)
      .radius(d => d.y)
      .angle(d => (rotationPlus + d.x) / 180 * Math.PI);

    const tensionButtons = [];
    const tensions = [0.25, 0.5, 0.75, 0.85, 1];
    tensions.map(t => {
      const style = (t === tension ? 'primary' : 'default');
      tensionButtons.push(
        <Button
          key={'tBtn' + t}
          bsSize={"xsmall"}
          bsStyle={style}
          onClick={() => { this.setState({ tension: t }); }}>
          {t}
        </Button>);
    });

    const rotationButtons = [];
    const rotations = [0, 45, 90, 180, 270];
    rotations.map(r => {
      const style = (r === rotationPlus ? 'primary' : 'default');
      rotationButtons.push(
        <Button
          key={'rBtn' + r}
          bsSize={"xsmall"}
          bsStyle={style}
          onClick={() => { this.setState({ rotationPlus: r }); }}>
          {r}
        </Button>);
    });

    const sources = new Set();
    const targets = new Set();

    return (<div>
      <h3>React rendered paths based on d3.v3 layout (bundle/cluster)</h3>
      <a target={'_blank'}
         href={'http://bl.ocks.org/mbostock/7607999'}>(Shamelessly taken here)</a>
      <h4>Motivation</h4>
      <p>This example uses "old" d3.v3 layouts and combines it with the new
      line generators, which are then rendered by react.</p>
      <p>We are perfectly aware of the fact that this is not optimal (since we are
      including the whole old d3 library and could just take these line generators),
      but for the sake of an example, it's valid.</p>
      <p>NOTE: The original example by Mike Bostock is still a bit faster. In this React code,
      we don't/can't select links and add classes on mouseover, we rather have to traditionally
      rerender all links. Using shouldComponentUpdate, we can get close.</p>
      <br/>

      <h4>Some Examples</h4>

      Tension: <ButtonGroup>
      {tensionButtons}
    </ButtonGroup>
      <br/>
      Rotation: <ButtonGroup>{rotationButtons}</ButtonGroup>

      <hr/>
      <svg width={size} height={size}>
        <g transform={'translate(' + radius + ', ' + radius + ')'}>
          <g>
            {lines.map((l, i) => {
              let classy = 'link';
              if (l.source.name === activeNode) {
                targets.add(l.target.name);
                classy += ' link--source';
              } else if (l.target.name === activeNode) {
                sources.add(l.source.name);
                classy += ' link--target';
              }
              return (<LinkPath key={'path' + i}
                                classy={classy}
                                tension={tension}
                                rotationPlus={rotationPlus}
                                l={l}
                                lineGenerator={lineGenerator}/>);
            })}
          </g>
          <g>
            {nodes.map((n, i) => {
              let classy = 'node';
              if (sources.has(n.name)) {
                classy += ' node--source';
              }
              if (targets.has(n.name)) {
                classy += ' node--target';
              }
              return (
                <NodeElement key={'txt' + i}
                             n={n}
                             classy={classy}
                             rotationPlus={rotationPlus}
                             onMouseOver={() => { this.setState({ activeNode: n.name }); }}
                             onMouseOut={() => { this.setState({ activeNode: '' }); }}
                />);
            })}
          </g>
        </g>
      </svg>
    </div>);
  }
}
