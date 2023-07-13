let edges = [];
let nodes = [];
let cells = [];

let largeRadius, smallRadius;
let center 

let horizontalPartitions = 1;
let lateralPartitions = 5;

class Node {
    constructor(pos, type) {
        this.pos = pos
        this.type = type;
        this.edges = [];
        this.cells = []; // Add cells property here
        this.dragged = false;
        this.velocity = createVector(0,0);
        this.force = createVector(0,0);
    }
    addCell(cell) {
        this.cells.push(cell);
    }
    
    addForce(f){
        this.force.add(f)
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

    move(){
        this.force.limit(5)
        this.velocity.add(this.force);
        this.pos.add(this.velocity); 
        this.force.mult(0)
        this.velocity.mult(0)
    }
    
    updatePosition() {
       

        if (!this.dragged) return;
        
        let d = dist(mouseX-width/2, mouseY-height/2, center.x, center.y);
        if(d > largeRadius) {
            let a = atan2(mouseY-height/2 - center.y, mouseX-width/2 - center.x);
            this.pos.x = center.x + largeRadius * cos(a);
            this.pos.y = center.y + largeRadius * sin(a);
        } else {
            this.pos.x = mouseX-width/2;
            this.pos.y = mouseY-height/2;
        }

    }
}
function angleBetweenEdges(edge1, edge2) {
    // Get vectors representing the edges
    let vector1 = p5.Vector.sub(edge1.nodeB.pos, edge1.nodeA.pos);
    let vector2 = p5.Vector.sub(edge2.nodeB.pos, edge2.nodeA.pos);

    // Normalize vectors
    vector1.normalize();
    vector2.normalize();

    // Calculate the angle between the vectors using the dot product
    let angle = Math.acos(vector1.dot(vector2));

    return angle;
}

class Edge {
    constructor(nodeA, nodeB, type) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.type = type;
        this.idealLength = this.getLength()
    }

    calcForces(){
        this.springForce()
    }
    
    addForce(f){
        this.nodeA.addForce(f)
        this.nodeB.addForce(f)
    }

    springForce(){
        const diff = this.getLength()-this.idealLength
        const springConstant = 0.1
        let dir = p5.Vector.sub(this.nodeB.pos, this.nodeA.pos).normalize().mult(diff*springConstant)
        this.nodeA.addForce(dir)
        this.nodeB.addForce(dir.mult(-1))
    }

    getLength(){
        return p5.Vector.dist(this.nodeA.pos, this.nodeB.pos)
    }

    getNormal(){
        return createVector(-(this.nodeB.pos.y-this.nodeA.pos.y), this.nodeB.pos.x-this.nodeA.pos.x).normalize()
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
        this.idealArea = this.getArea()
        this.angles = []
        for(let i = 0; i<this.nodes.length; i++){
            this.angles.push(this.getAngle(i))
        }
    }
    
    getCenter() {
        let sum = this.nodes.reduce((total, node) => p5.Vector.add(total,node.pos), createVector(0,0));
        return sum;
    }
    update(){
        this.osmosisForce()
        this.stiffness()
    }
    stiffness(){
        const stiffnessConstant = 2
        const mod = (n,m) => n - (m * Math.floor(n/m));
        const length = this.nodes.length
        for(let i = 0; i<length; i++){
            const angle = this.getAngle(i)
            const diff = mod((angle - this.angles[i] + PI), 2*PI) - PI
    
            const prev = this.nodes[mod(i-1, length)]
            const node = this.nodes[mod(i, length)]
            const next = this.nodes[mod(i+1, length)]
            
            const edge1 = this.edges[i]
            const edge2 = this.edges[mod(i-1, length)]
            
            const norm1 = edge1.getNormal()
            const norm2 = edge2.getNormal()
            
            norm1.mult(stiffnessConstant * diff / edge1.getLength())
            norm2.mult(stiffnessConstant * diff / edge1.getLength())
            
            node.addForce(norm1)
            node.addForce(norm2)
            
            prev.addForce(norm1.mult(1))
            next.addForce(norm2.mult(-1))
        }
    }
    getAngle(i){
        const mod = (n,m) => n - (m * Math.floor(n/m));
        const length = this.nodes.length
        
        const prev = this.nodes[mod(i-1, length)].pos
        const node = this.nodes[mod(i, length)].pos
        const next = this.nodes[mod(i+1, length)].pos
        
        const a = p5.Vector.sub(prev, node)
        const b = p5.Vector.sub(next, node)
        return Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x)                    
    }
    osmosisForce(){
        const area = this.getArea()
        const diff = area - this.idealArea
        const osmosisConstant = 0.00005
        for(let edge of this.edges){
            let normal = edge.getNormal()
            normal.mult(diff*osmosisConstant*edge.getLength())
            edge.addForce(normal)
        }
    }
    
    draw() {
        // now we can draw the cell as a polygon
        fill(255, 165, 0)
        strokeWeight(1);
        beginShape();
        this.nodes.forEach(node => vertex(node.pos.x, node.pos.y));
        endShape(CLOSE);
    }
    getArea() {
        let area = 0;
        for(let i = 0; i < this.nodes.length; i++){
            let j = (i + 1) % this.nodes.length;
            area += this.nodes[i].pos.x * this.nodes[j].pos.y;
            area -= this.nodes[j].pos.x * this.nodes[i].pos.y;
        }
        area /= 2;
        return abs(area);
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
    let previousVerticalNodes = null;

    
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
        if (previousLargeNode != null && previousSmallNode != null && previousVerticalNodes != null) {
            previousVerticalNodes.reverse()
            let previousVerticalEdges = createEdges(previousVerticalNodes, "verticalNode")
            
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

            let basalNodes = [verticalNodes[verticalNodes.length-1]]
            
            for(let j = 1; j < horizontalPartitions; j++) {
                let t = j / (horizontalPartitions);
                let vMid = p5.Vector.lerp(vSmall,previousSmallNode.pos, t);
                let ptMid = new Node(vMid, "innerRingLateralNode");
                basalNodes.push(ptMid);
                nodes.push(ptMid)
            }
            
            basalNodes.push(previousSmallNode)
            basalEdges = createEdges(basalNodes, "basalEdge")
            edges = edges.concat(basalEdges);

            //CELL CREATION

            let cell = new Cell([previousVerticalEdges, apicalEdges, verticalEdges, basalEdges].flat(),[previousVerticalEdges.map(e => e.nodeA),apicalEdges.map(e => e.nodeA),verticalEdges.map(e => e.nodeA), basalEdges.map(e => e.nodeA)].flat())
            cells.push(cell)
            
        }
        
        previousLargeNode = verticalNodes[0];
        previousSmallNode = verticalNodes[verticalNodes.length-1];
        previousVerticalNodes = verticalNodes;

        
        
        if (i === 0) {
            firstLargeNode = verticalNodes[0];
            firstSmallNode = verticalNodes[verticalNodes.length-1];
            firstVerticalEdges = verticalEdges
        }
    }
    
    previousVerticalNodes.reverse()
    let previousVerticalEdges = createEdges(previousVerticalNodes, "verticalNode")
    
    let apicalEdges, basalEdges
    // Connect the first and last edges

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
    
    let basalNodes = [firstSmallNode]
    for(let j = 1; j < horizontalPartitions; j++) {
        let t = j / (horizontalPartitions);
        let vMid = p5.Vector.lerp(firstSmallNode.pos, previousSmallNode.pos, t);
        let ptMid = new Node(vMid, "innerRingLateralNode");
        basalNodes.push(ptMid);
        nodes.push(ptMid)
    }
    basalNodes.push(previousSmallNode)
    basalEdges = createEdges(basalNodes, "basalEdge")
    edges = edges.concat(basalEdges);

    let cell = new Cell([previousVerticalEdges, apicalEdges, firstVerticalEdges, basalEdges].flat(), [previousVerticalEdges.map(e => e.nodeA),apicalEdges.map(e => e.nodeA),firstVerticalEdges.map(e => e.nodeA), basalEdges.map(e => e.nodeA)].flat())
    cells.push(cell)
    
    return ({nodes: nodes, edges:edges, cells:cells})
}

function setup() {
    createCanvas(800, 800);
    
    center = createVector(0,0)
    
    largeRadius = min(width, height) * 0.4;
    smallRadius = largeRadius * 0.7;
    
    let sectors = 80;

// 
    const embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 4, largeRadius, smallRadius);
    nodes = embryo.nodes
    edges = embryo.edges
    cells = embryo.cells
    
    // let nodeA = new Node(createVector(-20,0))
    // let nodeB = new Node(createVector(20,0))
    // let edge = new Edge(nodeA, nodeB)
    // nodes.push(nodeA)
    // nodes.push(nodeB)
    // edges.push(edge)
    // 
    // let nodeA = new Node(createVector(-20, -20))
    // let nodeB = new Node(createVector(20, -20))
    // let nodeC = new Node(createVector(20, 20))
    // let nodeD = new Node(createVector(-20, 20))
    // let edgeA = new Edge(nodeA, nodeB)
    // let edgeB = new Edge(nodeB, nodeC)
    // let edgeC = new Edge(nodeC, nodeD)
    // let edgeD = new Edge(nodeD, nodeA)
    // let cell = new Cell([edgeA, edgeB, edgeC, edgeD], [nodeA, nodeB, nodeC, nodeD])
    // 
    // nodes.push(nodeA)
    // nodes.push(nodeB)
    // nodes.push(nodeC)
    // nodes.push(nodeD)
    // 
    // edges.push(edgeA)
    // edges.push(edgeB)
    // edges.push(edgeC)
    // edges.push(edgeD)
    // 
    // cells.push(cell)
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
        cell.update()
    }

    for(let edge of edges) {
        edge.draw(); 
        edge.calcForces();
    }
    
    for(let node of nodes) {
        node.move();
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