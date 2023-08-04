let edges = [];
let nodes = [];
let cells = [];
let largeRadius = 320;
let smallRadius = largeRadius * 0.7;
let center = new Vector(0,0)
let horizontalPartitions = 1;
let lateralPartitions = 3;
let sectors = 80;
let mouse = new Vector(0,0)

let animationId = null;
let frames = [];
let recordGif = false;
let time = 0;

let deltaTime = 1;

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

let previousUpdateTime = -Infinity
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
    if(time - previousUpdateTime > 50){
        recordData()
        previousUpdateTime = time
    }
    document.getElementById("time").innerHTML = `Time: ${time}`

    animationId = requestAnimationFrame(draw);

}

let charts = []

createChart("Apical Length",()=>nodes[0].getDistance())
createChart("Apical Volume",()=>cells[0].getArea())


function recordData(){
    for(let {chart, query} of charts){
        chart.data.labels.push(time);
        chart.data.datasets[0].data.push(query())
        chart.update()
    }
}

function createChart(name, query){
    const chartElem = document.createElement("canvas")
    chartElem.id = 'chart' + charts.length
    document.querySelector("#sidebar").appendChild(chartElem)
    let chart = new Chart(chartElem, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: name,
                data: [],
                pointRadius: 0
            }]
        },
        options: {
            animation: {
                duration: 0 // general animation time
            }
        }
    });
    charts.push({chart:chart, query:query})
}



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