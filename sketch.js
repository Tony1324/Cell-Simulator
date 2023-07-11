let edges = [];
let nodes = [];
let cells = [];

let centerX, centerY, largeRadius, smallRadius;

let horizontalPartitions = 2;
let lateralPartitions = 4;

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
        if (dist(mouseX-width/2, mouseY-height/2, this.x, this.y) < 10) {
            this.dragged = true;
        }
    }
    
    mouseReleased() {
        this.dragged = false;
    }
    
    updatePosition() {
        if (!this.dragged) return;
        
        let d = dist(mouseX-width/2, mouseY-height/2, centerX, centerY);
        if(d > largeRadius) {
            let a = atan2(mouseY-height/2 - centerY, mouseX-width/2 - centerX);
            this.x = centerX + largeRadius * cos(a);
            this.y = centerY + largeRadius * sin(a);
        } else {
            this.x = mouseX-width/2;
            this.y = mouseY-height/2;
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
        line(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y);
    }
}

class Cell {
    constructor(edges, nodes) {
        this.edges = edges
        this.nodes = nodes
    }
    
    getCenter() {
        let sumX = this.nodes.reduce((total, node) => total + node.x, 0);
        let sumY = this.nodes.reduce((total, node) => total + node.y, 0);
        return {x: sumX / nodes.length, y: sumY / nodes.length};
    }
    
    draw() {
        // now we can draw the cell as a polygon
        fill(255, 165, 0)
        strokeWeight(1);
        beginShape();
        this.nodes.forEach(node => vertex(node.x, node.y));
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


function buildEmbryo(centerX, centerY, lateralPartitions, horizontalPartitions, sectors, offset, largeRadius, smallRadius){

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
        
        let xLarge = centerX + largeRadius * cos(thetaLarge);
        let yLarge = centerY + largeRadius * sin(thetaLarge);
        let xSmall = centerX + smallRadius * cos(thetaSmall);
        let ySmall = centerY + smallRadius * sin(thetaSmall);
        
        let ptLarge = new Node(xLarge, yLarge, "outerVertex");
        let ptSmall = new Node(xSmall, ySmall, "innerVertex");
        
        let verticalNodes = []
        for(let j = 0; j <= lateralPartitions; j++) {
            let t = j / lateralPartitions;
            let xMid = lerp(xLarge, xSmall, t);
            let yMid = lerp(yLarge, ySmall, t);
            let ptMid = new Node(xMid, yMid, "verticalNode");
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
                let xMid = lerp(previousLargeNode.x, ptLarge.x, t);
                let yMid = lerp(previousLargeNode.y, ptLarge.y, t);
                let ptMid = new Node(xMid, yMid, "outerRingLateralNode");
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
                let xMid = lerp(previousSmallNode.x, ptSmall.x, t);
                let yMid = lerp(previousSmallNode.y, ptSmall.y, t);
                let ptMid = new Node(xMid, yMid, "innerRingLateralNode");
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
    if (firstLargeNode !== null && previousLargeNode !== null) {
        let apicalNodes = [previousLargeNode]
        
        for(let j = 1; j < horizontalPartitions; j++) {
            let t = j / (horizontalPartitions);
            let xMid = lerp(previousLargeNode.x, firstLargeNode.x, t);
            let yMid = lerp(previousLargeNode.y, firstLargeNode.y, t);
            let ptMid = new Node(xMid, yMid, "outerRingLateralNode");
            apicalNodes.push(ptMid);
            nodes.push(ptMid);
        }
        apicalNodes.push(firstLargeNode)
        
        apicalEdges = createEdges(apicalNodes, "apicalEdge")
        edges = edges.concat(apicalEdges);
        
    }
    let basalEdges 
    if (firstSmallNode !== null && previousSmallNode !== null) {
        
        let basalNodes = [previousSmallNode]
        
        for(let j = 1; j < horizontalPartitions; j++) {
            let t = j / (horizontalPartitions);
            let xMid = lerp(previousSmallNode.x, firstSmallNode.x, t);
            let yMid = lerp(previousSmallNode.y, firstSmallNode.y, t);
            let ptMid = new Node(xMid, yMid, "innerRingLateralNode");
            basalNodes.push(ptMid);
            nodes.push(ptMid)
        }
        
        basalNodes.push(firstSmallNode)
        basalEdges = createEdges(basalNodes, "basalEdge")
        edges = edges.concat(basalEdges);
    }

    if(firstVerticalEdges !== null && previousVerticalEdges !==null){
        let cell = new Cell([previousVerticalEdges, basalEdges, firstVerticalEdges.slice().reverse(), apicalEdges.slice().reverse()].flat(), [previousVerticalEdges.map(e => e.nodeA),basalEdges.map(e => e.nodeA),firstVerticalEdges.slice().reverse().map(e => e.nodeB), apicalEdges.slice().reverse().map(e => e.nodeB)].flat())
        cells.push(cell)
    }
    return {nodes, edges, cells}
}

function setup() {
    createCanvas(800, 800);
    
    centerX = 0;
    centerY = 0;
    
    largeRadius = min(width, height) * 0.4;
    smallRadius = largeRadius * 0.7;
    
    let sectors = 80;


    buildEmbryo(centerX, centerY, lateralPartitions, horizontalPartitions, sectors, 4, largeRadius, smallRadius)
}


function draw() {
    translate(width/2, height/2)
    background(255);
    
    stroke(0);
    strokeWeight(3);
    noFill();
    ellipse(centerX, centerY, largeRadius * 2);
    
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
        let d = dist(mouseX-width/2, mouseY-height/2, node.x, node.y);
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