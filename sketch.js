let edges = [];
let nodes = [];
let cells = [];
let largeRadius, smallRadius;
let center 

let horizontalPartitions = 1;
let lateralPartitions = 4;

let mouse = new Vector(0,0)

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")


if (window.devicePixelRatio > 1) {
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

const width = canvas.width/window.devicePixelRatio
const height = canvas.height/window.devicePixelRatio

ctx.translate(width/2, height/2)
    
center = new Vector(0,0)

largeRadius = Math.min(width, height) * 0.4;
smallRadius = largeRadius * 0.7;

let sectors = 80;

const embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 100000, largeRadius, smallRadius);
nodes = embryo.nodes
edges = embryo.edges
cells = embryo.cells

// let nodeA = new Node(createVector(-20,0))
// let nodeB = new Node(createVector(20,0))
// let edge = new Edge(nodeA, nodeB)
// nodes.push(nodeA)
// nodes.push(nodeB)
// edges.push(edge)

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


function circle(v, radius, fill, fillStyle, stroke, strokeWidth) {
    ctx.beginPath()
    ctx.arc(v.x, v.y, radius, 0, 2 * Math.PI, false)
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = stroke
      ctx.stroke()
    }
}



function line(v1,v2, strokeWidth){
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    // Draw the Path
    ctx.closePath()
    ctx.lineWidth = strokeWidth
    ctx.stroke();
}

function polygon(vs, fill, fillStyle, stroke, strokeWidth){
    ctx.beginPath()
    ctx.moveTo(vs[0].x, vs[0].y)
    for(let i = 1; i<vs.length; i++){
        ctx.lineTo(vs[i].x, vs[i].y)
    }
    ctx.closePath()
    if (fill) {
        ctx.fillStyle = fillStyle
        ctx.fill()
      }
      if (stroke) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = stroke
        ctx.stroke()
      }
}

function arrow(v1, v2) {
    var headlen = 2; // length of head in pixels
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    var angle = Math.atan2(dy, dx);
    ctx.lineWidth = 1
    ctx.strokeStyle = 'green'
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.lineTo(v2.x - headlen * Math.cos(angle - Math.PI / 6), v2.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(v2.x, v2.y);
    ctx.lineTo(v2.x - headlen * Math.cos(angle + Math.PI / 6), v2.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'black'
  }

for(let i = 16; i < 24; i++){
    cells[i].edges[4].idealLength=0;
    cells[i].color = "red"
}

function draw() {
    ctx.clearRect(-width/2, -height/2, width, height)
    circle(center,largeRadius+1, false, undefined ,  true, 3)
    // polygon([new Vector(0,0), new Vector(0, 10), new Vector(10, 0)], true, 'red', true, 2);
    
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
    
    requestAnimationFrame(draw)
}

draw()

window.addEventListener("mousemove",(e)=>{
    mouse.x = e.pageX
    mouse.y = e.pageY
})

window.addEventListener("mousedown", ()=>{
    let nearestNode = null;
    let nearestDistance = Infinity;
    
    
    for(let node of nodes) {
        let d = Vector.dist(new Vector(mouse.x-width/2, mouse.y-height/2), node.pos);
        if (d < 10 && d < nearestDistance) {
            nearestDistance = d;
            nearestNode = node;
        }
    }
    
    if (nearestNode) {
        nearestNode.mousePressed();
    }
})
window.addEventListener("mouseup", ()=>{
    for(let node of nodes) {
        if(node.dragged) {
            node.mouseReleased();
        }
    }
})