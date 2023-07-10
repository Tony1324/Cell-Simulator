let edges = [];
let nodes = [];

let centerX, centerY, largeRadius, smallRadius;

let lateralPartitions = 2;
let verticalPartitions = 3;

class Node {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.edges = [];
    this.cells = []; // Add cells property here
    this.dragged = false;
  }
  addCell(cell) {
    this.cells.push(cell);
  }

  draw() {
    fill(0);
    noStroke();
    ellipse(this.x, this.y, 5, 5);
  }

  mousePressed() {
    if (dist(mouseX, mouseY, this.x, this.y) < 10) {
      this.dragged = true;
    }
  }

  mouseReleased() {
    this.dragged = false;
  }

  updatePosition() {
    if (!this.dragged) return;

    let d = dist(mouseX, mouseY, centerX, centerY);
    if(d > largeRadius) {
      let a = atan2(mouseY - centerY, mouseX - centerX);
      this.x = centerX + largeRadius * cos(a);
      this.y = centerY + largeRadius * sin(a);
    } else {
      this.x = mouseX;
      this.y = mouseY;
    }
  }
}

class Edge {
  constructor(nodes, type) {
    this.nodes = nodes;
    this.type = type;
  }

  addNode(node) {
    this.nodes.push(node);
    node.edges.push(this);
  }

  draw() {
    stroke(0);
    strokeWeight(1);
    for(let i = 0; i < this.nodes.length - 1; i++) {
      line(this.nodes[i].x, this.nodes[i].y, this.nodes[i + 1].x, this.nodes[i + 1].y);
    }
  }
}

class Cell {
  constructor(vertEdge1, vertEdge2, innerLatEdge, outerLatEdge) {
    this.vertEdge1 = vertEdge1;
    this.vertEdge2 = vertEdge2;
    this.innerLatEdge = innerLatEdge;
    this.outerLatEdge = outerLatEdge;
    this.getNodes().forEach(node => node.addCell(this));

  }

  getCenter() {
    let nodes = this.getNodes();
    let sumX = nodes.reduce((total, node) => total + node.x, 0);
    let sumY = nodes.reduce((total, node) => total + node.y, 0);
    return {x: sumX / nodes.length, y: sumY / nodes.length};
  }

  getNodes() {
    let nodes = [];
    [this.vertEdge1, this.vertEdge2, this.innerLatEdge, this.outerLatEdge].forEach(edge => {
      edge.nodes.forEach(node => {
        if (!nodes.includes(node)) {
          nodes.push(node);
        }
      });
    });
    return nodes;
  }

  draw() {
    let nodes = this.getNodes();
    let center = this.getCenter();

    // sort the nodes based on their angles relative to the cell's center
    nodes.sort((nodeA, nodeB) => {
      let angleA = atan2(nodeA.y - center.y, nodeA.x - center.x);
      let angleB = atan2(nodeB.y - center.y, nodeB.x - center.x);
      return angleA - angleB;
    });

    // now we can draw the cell as a polygon
    beginShape();
    nodes.forEach(node => vertex(node.x, node.y));
    endShape(CLOSE);
  }
}



function setup() {
  createCanvas(800, 800);

  centerX = width / 2;
  centerY = height / 2;

  largeRadius = min(width, height) * 0.4;
  smallRadius = largeRadius * 0.7;

  let sectors = 80;
  let angle = TWO_PI / sectors;
  let offsetLimit = angle / 4;

  let firstLargeNode = null;
  let firstSmallNode = null;
  let previousLargeNode = null;
  let previousSmallNode = null;

  for (let i = 0; i < sectors; i++) {
    let thetaLarge = i * angle + random(-offsetLimit, offsetLimit);
    let thetaSmall = i * angle + random(-offsetLimit, offsetLimit);

    let xLarge = centerX + largeRadius * cos(thetaLarge);
    let yLarge = centerY + largeRadius * sin(thetaLarge);
    let xSmall = centerX + smallRadius * cos(thetaSmall);
    let ySmall = centerY + smallRadius * sin(thetaSmall);

    let ptLarge = new Node(xLarge, yLarge, "outerVertex");
    let ptSmall = new Node(xSmall, ySmall, "innerVertex");

    nodes.push(ptLarge);
    nodes.push(ptSmall);

    let verticalEdge = new Edge([], "verticalEdge");
    verticalEdge.addNode(ptLarge);

    for(let j = 1; j <= verticalPartitions; j++) {
      let t = j / (verticalPartitions + 1);
      let xMid = lerp(xLarge, xSmall, t);
      let yMid = lerp(yLarge, ySmall, t);
      let ptMid = new Node(xMid, yMid, "verticalNode");
      nodes.push(ptMid);
      verticalEdge.addNode(ptMid);
    }

    verticalEdge.addNode(ptSmall);
    edges.push(verticalEdge);

    // create lateral edges between consecutive large and small nodes
    if (previousLargeNode != null && previousSmallNode != null) {
      let lateralEdgeLarge = new Edge([], "outerLateralEdge");
      lateralEdgeLarge.addNode(previousLargeNode);

      for(let j = 1; j <= lateralPartitions; j++) {
        let t = j / (lateralPartitions + 1);
        let xMid = lerp(previousLargeNode.x, ptLarge.x, t);
        let yMid = lerp(previousLargeNode.y, ptLarge.y, t);
        let ptMid = new Node(xMid, yMid, "outerRingLateralNode");
        nodes.push(ptMid);
        lateralEdgeLarge.addNode(ptMid);
      }

      lateralEdgeLarge.addNode(ptLarge);
      edges.push(lateralEdgeLarge);

      let lateralEdgeSmall = new Edge([], "innerLateralEdge");
      lateralEdgeSmall.addNode(previousSmallNode);

      for(let j = 1; j <= lateralPartitions; j++) {
        let t = j / (lateralPartitions + 1);
        let xMid = lerp(previousSmallNode.x, ptSmall.x, t);
        let yMid = lerp(previousSmallNode.y, ptSmall.y, t);
        let ptMid = new Node(xMid, yMid, "innerRingLateralNode");
        nodes.push(ptMid);
        lateralEdgeSmall.addNode(ptMid);
      }

      lateralEdgeSmall.addNode(ptSmall);
      edges.push(lateralEdgeSmall);
    }

    previousLargeNode = ptLarge;
    previousSmallNode = ptSmall;

    if (i === 0) {
      firstLargeNode = ptLarge;
      firstSmallNode = ptSmall;
    }
  }

  // Connect the first and last edges
  if (firstLargeNode !== null && previousLargeNode !== null) {
    let lateralEdgeLarge = new Edge([], "outerLateralEdge");
    lateralEdgeLarge.addNode(previousLargeNode);

    for(let j = 1; j <= lateralPartitions; j++) {
      let t = j / (lateralPartitions + 1);
      let xMid = lerp(previousLargeNode.x, firstLargeNode.x, t);
      let yMid = lerp(previousLargeNode.y, firstLargeNode.y, t);
      let ptMid = new Node(xMid, yMid, "outerRingLateralNode");
      nodes.push(ptMid);
      lateralEdgeLarge.addNode(ptMid);
    }

    lateralEdgeLarge.addNode(firstLargeNode);
    edges.push(lateralEdgeLarge);
  }

  if (firstSmallNode !== null && previousSmallNode !== null) {
    let lateralEdgeSmall = new Edge([], "innerLateralEdge");
    lateralEdgeSmall.addNode(previousSmallNode);

    for(let j = 1; j <= lateralPartitions; j++) {
      let t = j / (lateralPartitions + 1);
      let xMid = lerp(previousSmallNode.x, firstSmallNode.x, t);
      let yMid = lerp(previousSmallNode.y, firstSmallNode.y, t);
      let ptMid = new Node(xMid, yMid, "innerRingLateralNode");
      nodes.push(ptMid);
      lateralEdgeSmall.addNode(ptMid);
    }

    lateralEdgeSmall.addNode(firstSmallNode);
    edges.push(lateralEdgeSmall);
  }
}


function draw() {
  background(255);

  stroke(0);
  strokeWeight(3);
  noFill();
  ellipse(centerX, centerY, largeRadius * 2);

  for(let edge of edges) {
    edge.draw();
  }

  for(let node of nodes) {
    node.updatePosition();
    node.draw();
  }
  
  let testCell = new Cell(edges[0], edges[2], edges[1], edges[3]);
  testCell.draw();
  
}


function mousePressed() {
  let nearestNode = null;
  let nearestDistance = Infinity;


  for(let node of nodes) {
    let d = dist(mouseX, mouseY, node.x, node.y);
    if (d < 10 && d < nearestDistance) {
      nearestDistance = d;
      nearestNode = node;
    }
  }

  if (nearestNode) {
    nearestNode.mousePressed();
  }
}

function mouseReleased() {
  for(let node of nodes) {
    if(node.dragged) {
      node.mouseReleased();
    }
  }
}