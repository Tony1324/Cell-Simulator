let edges = [];
let nodes = [];
let cells = [];
let largeRadius, smallRadius;
let center 

let horizontalPartitions = 1;
let lateralPartitions = 3;

let mouse = new Vector(0,0)

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext('2d', { willReadFrequently: true });


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

let embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 0, largeRadius, smallRadius);
nodes = embryo.nodes
edges = embryo.edges
cells = embryo.cells

// let nodeA = new Node(new Vector(-20,0))
// let nodeB = new Node(new Vector(20,0))
// let edge = new Edge(nodeA, nodeB)
// nodes.push(nodeA)
// nodes.push(nodeB)
// edges.push(edge)

// let nodeA = new Node(new Vector(-20, -20))
// let nodeB = new Node(new Vector(20, -20))
// let nodeC = new Node(new Vector(20, 20))
// let nodeD = new Node(new Vector(-20, 20))
// let edgeA = new Edge(nodeA, nodeB)
// let edgeB = new Edge(nodeB, nodeC)
// let edgeC = new Edge(nodeC, nodeD)
// let edgeD = new Edge(nodeD, nodeA)
// let cell = new Cell([edgeA, edgeB, edgeC, edgeD], [nodeA, nodeB, nodeC, nodeD])

// nodes.push(nodeA)
// nodes.push(nodeB)
// nodes.push(nodeC)
// nodes.push(nodeD)

// edges.push(edgeA)
// edges.push(edgeB)
// edges.push(edgeC)
// edges.push(edgeD)

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

function arrow(v1, v2,color) {
    var headlen = 2; // length of head in pixels
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    var angle = Math.atan2(dy, dx);
    ctx.lineWidth = 1
    ctx.strokeStyle = color ?? "#0000"
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
function setUpConstrictingCells(){
    for(let i = 0; i < sectors; i++){
    let ringDistance = getRingDistance(i)
    let constriction = getApicalConstrictionAmount(ringDistance)
    for (let j = 0; j < horizontalPartitions; j++){
        cells[i].edges[lateralPartitions + j].idealLength *= constriction;
        cells[i].edges[lateralPartitions + j].springConstant += 0.3 * (1-constriction);
    }
    cells[i].color = `rgb(255, ${constriction*200}, 0)`
    
    for (let j = 0; j < lateralPartitions; j++){
        cells[i].edges[j].idealLength *= (1 - (0.3 * constriction));
        cells[i].edges[j+horizontalPartitions+lateralPartitions].idealLength *= (1 - (0.3 * constriction));
    }
    }
}

let animationId = null;
let frames = [];
let recordGif = false;
let time = 0;
let deltaTime = 1;
function draw() {
    ctx.clearRect(-width/2, -height/2, width, height)

    //for the gif
    if (recordGif){
        ctx.fillStyle = 'white';
        ctx.fillRect(-width/2, -height/2, width, height);
    }
    circle(center,largeRadius+1, false, undefined ,  true, 3)

    for(let cell of cells) {
        cell.draw()
        cell.update()
    }

    for(let edge of edges) {
        edge.draw(); 
        edge.update();
    }
    
    for(let node of nodes) {
        node.draw();
        node.update();
        node.move();
        node.updatePosition();
    }
    
    if (recordGif){ 
        let dataURL = canvas.toDataURL("image/png");
        frames.push(dataURL);
    }
    time += deltaTime;
    document.getElementById("time").innerHTML = `Time: ${time}`
    animationId = requestAnimationFrame(draw);
}


let chartA = new Chart(document.getElementById("chartA"), {
    type: 'line',
    labels:[1,2,3,4,5,6],
    data: {
        datasets:[{
            data: [1,2,3,4,5]
        }]
    },
});

// chartA.data.datasets[0].data.push({x:1, y:2})
// chartA.data.datasets[0].data.push({x:3, y:3})
// chartA.data.datasets[0].data.push({x:4, y:5})
// chartA.data.datasets[0].data.push({x:5, y:1})
// chartA.update()

draw()
setUpConstrictingCells()
function createGif() {
    recordGif = false
    let progressText = document.getElementById('progress');
    
    gifshot.createGIF({
        images: frames,
        gifWidth: width,   // Reduce the resolution
        gifHeight: height, // Reduce the resolution
        frameDuration: 0.5,
        progressCallback: function (progress) {
            progressText.innerText = 'Creating GIF: ' + Math.round(progress * 100) + '%';
        },
    }, function (obj) {
        if (obj.error) {
            console.error('gifshot error:', obj.error);
            return;
        }
        
        var image = obj.image;

        // Create an img element and set its src to the image data
        var img = document.createElement('img');
        img.src = image;

        // Append the img to the document body
        document.body.appendChild(img);

        // Create a button for downloading the GIF
        var button = document.createElement('button');
        button.innerText = 'Download GIF';
        button.onclick = function () {
            // Create a link element
            var link = document.createElement('a');

            // Set the download attribute to automatically download the image
            link.download = 'simulation.gif';

            // Set the href to the image data
            link.href = image;

            // Simulate a click on the link to start the download
            link.click();
        };

        // Append the button to the document body
        
        document.getElementById('sidebar').appendChild(img);

        // Create a wrapper div for buttons
        var buttonWrapper = document.createElement('div');
        buttonWrapper.style.display = 'flex';
    
        // Add the download button
        var button = document.createElement('button');
        button.innerText = 'Download GIF';
        button.onclick = function () {
            var link = document.createElement('a');
            link.download = 'simulation.gif';
            link.href = image;
            link.click();
        };
        buttonWrapper.appendChild(button);
        
        // Add button for opening GIF in new tab
        var openButton = document.createElement('button');
        openButton.innerText = 'Open GIF in New Tab';
        openButton.onclick = function () {
            // Convert base64/URLEncoded data component to raw binary data held in a string
            var byteString;
            if (image.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(image.split(',')[1]);
            else
                byteString = unescape(image.split(',')[1]);
    
            // separate out the mime component
            var mimeString = image.split(',')[0].split(':')[1].split(';')[0];
    
            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
    
            // Create blob URL
            var blob = new Blob([ia], {type:mimeString});
            var blobUrl = URL.createObjectURL(blob);
            
            window.open(blobUrl, '_blank');
        };
        buttonWrapper.appendChild(openButton);
        
        // Append the wrapper to output
        document.getElementById('sidebar').appendChild(buttonWrapper);

    });``
}

function startGif(){
    recordGif = true;
}
document.getElementById("create-gif-button").addEventListener("click", () => {
    createGif});
document.getElementById("start-gif").addEventListener("click", startGif);
document.getElementById("start-button").addEventListener("click", ()=>{
    if(animationId !== null) cancelAnimationFrame(animationId);
    // Any code to reset the state of the simulation
    frames = [];
    edges = [];
    nodes = [];
    cells = [];
    let embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 0, largeRadius, smallRadius);
    nodes = embryo.nodes
    edges = embryo.edges
    cells = embryo.cells
    setUpConstrictingCells();
    draw();
})

document.getElementById("play-pause-button").addEventListener("click", ()=>{
    if(animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null;
        document.getElementById("play-pause-button").innerText = "Resume"
    } else{
        draw()
        document.getElementById("play-pause-button").innerText = "Pause"
    }
})
window.addEventListener("mousemove",(e)=>{
    let pos = canvas.getBoundingClientRect()
    mouse.x = e.pageX - pos.left - document.documentElement.scrollLeft
    mouse.y = e.pageY - pos.top - document.documentElement.scrollTop
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