class Node {
    constructor(pos, type) {
        this.pos = pos
        this.type = type;
        this.edges = [];
        this.cells = []; // Add cells property here
        this.dragged = false;
        this.velocity = new Vector(0,0);
        this.force = new Vector(0,0);
    }
    addCell(cell) {
        this.cells.push(cell);
    }
    
    addForce(f){
        this.force.add(f)
    }

    draw() {
        circle(this.pos,1,  false, undefined, true, 2);
    }
    
    mousePressed() {
        if (Vector.dist(new Vector(mouse.x-width/2, mouse.y-height/2), this.pos) < 10) {
            this.dragged = true;
        }
    }
    
    mouseReleased() {
        this.dragged = false;
    }

    move(){
        this.force.limit(5);
        arrow(this.pos, Vector.add(this.pos, Vector.mult(this.force, 50)))
        this.velocity.add(this.force);
        this.pos.add(this.velocity); 
        this.force.mult(0)
        this.velocity.mult(0)
        this.pos.limit(largeRadius);
    }
    
    updatePosition() {
       

        if (!this.dragged) return;
        
        let d = Vector.dist(new Vector(mouse.x-width/2, mouse.y-height/2), center);
        if(d > largeRadius) {
            let a = Math.atan2(mouse.y-height/2 - center.y, mouse.x-width/2 - center.x);
            this.pos.x = center.x + largeRadius * Math.cos(a);
            this.pos.y = center.y + largeRadius * Math.sin(a);
        } else {
            this.pos.x = mouse.x-width/2;
            this.pos.y = mouse.y-height/2;
        }

    }
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
        let dir = Vector.sub(this.nodeB.pos, this.nodeA.pos).normalize().mult(diff*springConstant)
        this.nodeA.addForce(dir)
        this.nodeB.addForce(dir.mult(-1))
    }

    getLength(){
        return Vector.dist(this.nodeA.pos, this.nodeB.pos)
    }

    getNormal(){
        return new Vector(-(this.nodeB.pos.y-this.nodeA.pos.y), this.nodeB.pos.x-this.nodeA.pos.x).normalize()
    }
    draw() {
        line(this.nodeA.pos, this.nodeB.pos, true, 1);
    }
}

class Cell {
    constructor(edges, nodes, config) {
        this.edges = edges
        this.nodes = nodes
        this.idealArea = this.getArea()
        this.angles = []
        for(let i = 0; i<this.nodes.length; i++){
            this.angles.push(this.getAngle(i))
        }
        this.stiffnessConstant = 3
        this.osmosisConstant = 0.00002
        this.color = '#F609'
        Object.assign(this, config)
        
    }
    
    getCenter() {
        let sum = this.nodes.reduce((total, node) => Vector.add(total,node.pos), new Vector(0,0));
        return sum;
    }
    update(){
        this.osmosisForce()
        // this.stiffness()
    }
    stiffness(){
        const mod = (n,m) => n - (m * Math.floor(n/m));
        const length = this.nodes.length
        for(let i = 0; i<length; i++){
            const angle = this.getAngle(i)
            const diff = angle - this.angles[i]
    
            const prev = this.nodes[mod(i-1, length)]
            const node = this.nodes[mod(i, length)]
            const next = this.nodes[mod(i+1, length)]
            
            const edge1 = this.edges[i]
            const edge2 = this.edges[mod(i-1, length)]
            
            const norm1 = edge1.getNormal()
            const norm2 = edge2.getNormal()
            
            norm1.mult(this.stiffnessConstant * diff / edge1.getLength())
            norm2.mult(this.stiffnessConstant * diff / edge1.getLength())
            
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
        
        const a = Vector.sub(prev, node).normalize()
        const b = Vector.sub(next, node).normalize()
        
        let angle = Math.atan2(Vector.cross(a,b).z, Vector.dot(a,b))  
        if(angle < 0){
            angle+=2*Math.PI
        }
        return angle
    }
    osmosisForce(){
        const area = this.getArea()
        const diff = area - this.idealArea
        for(let edge of this.edges){
            let normal = edge.getNormal()
            normal.mult(diff*this.osmosisConstant*edge.getLength())
            edge.addForce(normal)
        }
    }
    
    draw() {
        // now we can draw the cell as a polygon
        polygon(this.nodes.map(n => n.pos), true, this.color , false, 2)
    }
    
    getArea() {
        let area = 0;
        for(let i = 0; i < this.nodes.length; i++){
            let j = (i + 1) % this.nodes.length;
            area += this.nodes[i].pos.x * this.nodes[j].pos.y;
            area -= this.nodes[j].pos.x * this.nodes[i].pos.y;
        }
        area /= 2;
        return Math.abs(area);
    }
}
function getArea(nodes) {
    let area = 0;
    for(let i = 0; i < nodes.length; i++){
        let j = (i + 1) % nodes.length;
        area += nodes[i].pos.x * nodes[j].pos.y;
        area -= nodes[j].pos.x * nodes[i].pos.y;
    }
    area /= 2;
    return Math.abs(area);
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
    let basalRing = [];
    let apicalRing = [];

    let angle = 2*Math.PI / sectors;
    let offsetLimit = angle / offset;
    let firstLargeNode = null;
    let firstSmallNode = null;
    let firstVerticalEdges = null;
    let previousLargeNode = null;
    let previousSmallNode = null;
    let previousVerticalNodes = null;

    
    for (let i = 0; i < sectors; i++) {
        let thetaLarge = i * angle + (Math.random()-0.5) * offsetLimit * 2;
        let thetaSmall = i * angle + (Math.random()-0.5) * offsetLimit * 2;

        let vLarge = new Vector(largeRadius, 0)
        vLarge.rotate(thetaLarge)

        let vSmall = new Vector(smallRadius, 0)
        vSmall.rotate(thetaSmall)
        
        let verticalNodes = []
        for(let j = 0; j <= lateralPartitions; j++) {
            let t = j / lateralPartitions;
            let vMid = Vector.lerp(vLarge, vSmall, t);
            let ptMid = new Node(vMid, "verticalNode");
            verticalNodes.push(ptMid);
        }
        apicalRing.push(verticalNodes[0])
        basalRing.push(verticalNodes[verticalNodes.length-1])
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
                let vMid = Vector.lerp(previousLargeNode.pos, vLarge, t);
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
                let vMid = Vector.lerp(vSmall,previousSmallNode.pos, t);
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
        let vMid = Vector.lerp(previousLargeNode.pos, firstLargeNode.pos, t);
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
        let vMid = Vector.lerp(firstSmallNode.pos, previousSmallNode.pos, t);
        let ptMid = new Node(vMid, "innerRingLateralNode");
        basalNodes.push(ptMid);
        nodes.push(ptMid)
    }
    basalNodes.push(previousSmallNode)
    basalEdges = createEdges(basalNodes, "basalEdge")
    edges = edges.concat(basalEdges);

    let cell = new Cell([previousVerticalEdges, apicalEdges, firstVerticalEdges, basalEdges].flat(), [previousVerticalEdges.map(e => e.nodeA),apicalEdges.map(e => e.nodeA),firstVerticalEdges.map(e => e.nodeA), basalEdges.map(e => e.nodeA)].flat())
    cells.push(cell)
    
    cells.push(createRingCell(apicalRing))
    cells.push(createRingCell(basalRing))
    return ({nodes: nodes, edges:edges, cells:cells})
}

function createRingCell(nodes){
    let edges = []
    for(let i = 0; i < nodes.length; i++){
        const nodeA = nodes[i]
        const nodeB = nodes[(i+1)%nodes.length]
        const edge = new Edge(nodeA, nodeB)
        edges.push(edge)
    }
    return new Cell(edges, nodes, {stiffnessConstant: 0, osmosisConstant:0.000001, color: "#0000"})
}

class Vector {
    constructor(x, y, z = 0) {
        this.x = x
        this.y = y
        this.z = z
    }

    get magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
    }

    set magnitude(len) {
        let scaleFactor = len / this.magnitude
        this.mult(scaleFactor)
    }

    copy() {
        return new Vector(this.x, this.y, this.z)
    }

    normalize() {
        this.magnitude = 1
        return this
    }

    mult(s) {
        this.x *= s
        this.y *= s
        this.z *= s
        return this
    }

    limit(x){
        if(this.magnitude >= x){
            this.magnitude = x
        }
    }

    add(v) {
        this.x += v.x
        this.y += v.y
        this.z += v.z
        return this
    }

    sub(v) {
        this.x -= v.x
        this.y -= v.y
        this.z -= v.z
        return this
    }
    rotate(theta){
        let x2, y2;
        x2 = Math.cos(theta)*this.x - Math.sin(theta)*this.y;
        y2 = Math.sin(theta)*this.x + Math.cos(theta)*this.y;

        this.x = x2;
        this.y = y2;
    }
    static lerp(v1, v2, t){
        return Vector.sub(v2, v1).mult(t).add(v1)
    }
    static dist(v1, v2){
        return Math.sqrt(((v1.x-v2.x)**2)+((v1.y-v2.y)**2))
    }
    static normalize(v) {
        return v.copy().normalize()
    }

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z)
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z)
    }

    static mult(v, s) {
        return new Vector(v.x * s, v.y * s, v.z * s)
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
    }

    static cross(v1, v2) {
        return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x)
    }

    
}