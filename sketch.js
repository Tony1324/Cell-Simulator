let edges = [];
let nodes = [];
let cells = [];

let largeRadius, smallRadius;
let center 

let horizontalPartitions = 2;
let lateralPartitions = 4;

class Node {
    constructor(pos, type) {
        this.pos = pos
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
        ellipse(this.pos.x, this.pos.y, 5, 5);
    }
    
    mousePressed() {
        if (dist(mouseX-width/2, mouseY-height/2, this.pos.x, this.pos.y) < 10) {
            this.dragged = true;
        }
    }
    
    mouseReleased() {
        this.dragged = false;
    }
    
    updatePosition() {
        if (!this.dragged) return;
        
        let d = dist(mouseX-width/2, mouseY-height/2, center.x, center.y);
        if(d > largeRadius) {
            let a = atan2(mouseY-height/2 - centerY, mouseX-width/2 - center.x);
            this.pos.x = centerX + largeRadius * cos(a);
            this.pos.y = centerY + largeRadius * sin(a);
        } else {
            this.pos.x = mouseX-width/2;
            this.pos.y = mouseY-height/2;
        }
    }
}

class Edge {
    constructor(nodeA, nodeB, type) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.type = type;
    }
    
    draw() {
        stroke(0);
        strokeWeight(1);
        line(this.nodeA.pos.x, this.nodeA.pos.y, this.nodeB.pos.x, this.nodeB.pos.y);
    }
}

class Cell {
    constructor(edges, nodes) {
        this.edges = edges
        this.nodes = nodes
    }
    
    getCenter() {
        let sum = this.nodes.reduce((total, node) => p5.Vector.add(total,node.pos), createVector(0,0));
        return sum;
    }
    
    draw() {
        // now we can draw the cell as a polygon
        fill(255, 165, 0)
        strokeWeight(1);
        beginShape();
        this.nodes.forEach(node => vertex(node.pos.x, node.pos.y));
        endShape(CLOSE);
    }
}

function createEdges(nodes, ...edgeParams){
    let edges = []
    for(let i = 0; i < nodes.length -1; i++){
        edges.push(new Edge(nodes[i], nodes[i+1], ...edgeParams))
    }
    return edges
}


function buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, offset, largeRadius, smallRadius){
    let edges = [];
    let nodes = [];
    let cells = [];

    let angle = TWO_PI / sectors;
    let offsetLimit = angle / offset;
    let firstLargeNode = null;
    let firstSmallNode = null;
    let firstVerticalEdges = null;
    let previousLargeNode = null;
    let previousSmallNode = null;
    let previousVerticalEdges = null;

    
    for (let i = 0; i < sectors; i++) {
        let thetaLarge = i * angle + random(-offsetLimit, offsetLimit);
        let thetaSmall = i * angle + random(-offsetLimit, offsetLimit);

        let vLarge = createVector(largeRadius, 0)
        vLarge.rotate(thetaLarge)

        let vSmall = createVector(smallRadius, 0)
        vSmall.rotate(thetaSmall)
        
        let verticalNodes = []
        for(let j = 0; j <= lateralPartitions; j++) {
            let t = j / lateralPartitions;
            let vMid = p5.Vector.lerp(vLarge, vSmall, t);
            let ptMid = new Node(vMid, "verticalNode");
            verticalNodes.push(ptMid);
        }
        nodes = nodes.concat(verticalNodes)
        let verticalEdges = createEdges(verticalNodes, "verticalNode")
        edges = edges.concat(verticalEdges)
        
        let apicalEdges, basalEdges
        // create lateral edges between consecutive large and small nodes
        if (previousLargeNode != null && previousSmallNode != null && previousVerticalEdges != null) {
            // APICAL EDGES
            let apicalNodes = [previousLargeNode]
            
            for(let j = 1; j < horizontalPartitions; j++) {
                let t = j / (horizontalPartitions);
                let vMid = p5.Vector.lerp(previousLargeNode.pos, vLarge, t);
                let ptMid = new Node(vMid, "outerRingLateralNode");
                apicalNodes.push(ptMid);
                nodes.push(ptMid)
            }
            
            apicalNodes.push(verticalNodes[0])
            
            apicalEdges = createEdges(apicalNodes, "apicalEdge")
            edges = edges.concat(apicalEdges);

            //BASAL EDGES

            let basalNodes = [previousSmallNode]
            
            for(let j = 1; j < horizontalPartitions; j++) {
                let t = j / (horizontalPartitions);
                let vMid = p5.Vector.lerp(previousSmallNode.pos, vSmall, t);
                let ptMid = new Node(vMid, "innerRingLateralNode");
                basalNodes.push(ptMid);
                nodes.push(ptMid)
            }
            
            basalNodes.push(verticalNodes[verticalNodes.length-1])
            basalEdges = createEdges(basalNodes, "basalEdge")
            edges = edges.concat(basalEdges);

            //CELL CREATION

            let cell = new Cell([previousVerticalEdges, basalEdges, verticalEdges.slice().reverse(), apicalEdges.slice().reverse()].flat(),[previousVerticalEdges.map(e => e.nodeA),basalEdges.map(e => e.nodeA),verticalEdges.slice().reverse().map(e => e.nodeB), apicalEdges.slice().reverse().map(e => e.nodeB)].flat())
            cells.push(cell)
            
        }
        
        previousLargeNode = verticalNodes[0];
        previousSmallNode = verticalNodes[verticalNodes.length-1];
        previousVerticalEdges = verticalEdges;

        
        
        if (i === 0) {
            firstLargeNode = verticalNodes[0];
            firstSmallNode = verticalNodes[verticalNodes.length-1];
            firstVerticalEdges = verticalEdges
        }
    }
    let apicalEdges
    // Connect the first and last edges
    if (firstLargeNode && previousLargeNode) {

        let apicalNodes = [previousLargeNode]
        
        for(let j = 1; j < horizontalPartitions; j++) {
            let t = j / (horizontalPartitions);
            let vMid = p5.Vector.lerp(previousLargeNode.pos, firstLargeNode.pos, t);
            let ptMid = new Node(vMid, "outerRingLateralNode");
            apicalNodes.push(ptMid);
            nodes.push(ptMid);
        }
        apicalNodes.push(firstLargeNode)
        
        apicalEdges = createEdges(apicalNodes, "apicalEdge")
        edges = edges.concat(apicalEdges);
        
    }
    let basalEdges 
    if (firstSmallNode && previousSmallNode) {
        
        let basalNodes = [previousSmallNode]
        
        for(let j = 1; j < horizontalPartitions; j++) {
            let t = j / (horizontalPartitions);
            let vMid = p5.Vector.lerp(previousSmallNode.pos, firstSmallNode.pos, t);
            let ptMid = new Node(vMid, "innerRingLateralNode");
            basalNodes.push(ptMid);
            nodes.push(ptMid)
        }
        
        basalNodes.push(firstSmallNode)
        basalEdges = createEdges(basalNodes, "basalEdge")
        edges = edges.concat(basalEdges);
    }

    if(firstVerticalEdges && previousVerticalEdges && basalEdges && apicalEdges){
        let cell = new Cell([previousVerticalEdges, basalEdges, firstVerticalEdges.slice().reverse(), apicalEdges.slice().reverse()].flat(), [previousVerticalEdges.map(e => e.nodeA),basalEdges.map(e => e.nodeA),firstVerticalEdges.slice().reverse().map(e => e.nodeB), apicalEdges.slice().reverse().map(e => e.nodeB)].flat())
        cells.push(cell)
    }
    return ({nodes: nodes, edges:edges, cells:cells})
}

function setup() {
    createCanvas(800, 800);
    
    center = createVector(0,0)
    
    largeRadius = min(width, height) * 0.4;
    smallRadius = largeRadius * 0.7;
    
    let sectors = 80;


    const embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 4, largeRadius, smallRadius);
    nodes = embryo.nodes
    edges = embryo.edges
    cells = embryo.cells
}


function draw() {
    translate(width/2, height/2);
    background(255);
    
    stroke(0);
    strokeWeight(3);
    noFill();
    ellipse(center.x, center.y, largeRadius * 2);
    
    for(let cell of cells) {
        cell.draw()
    }

    for(let edge of edges) {
        edge.draw(); 
    }
    
    for(let node of nodes) {
        node.updatePosition();
        node.draw();
    }

    
}


function mousePressed() {
    let nearestNode = null;
    let nearestDistance = Infinity;
    
    
    for(let node of nodes) {
        let d = dist(mouseX-width/2, mouseY-height/2, node.pos.x, node.pos.y);
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