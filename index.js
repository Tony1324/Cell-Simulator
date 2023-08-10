//CONSTANTS
let largeRadius = 250;
let smallRadius = largeRadius * 0.65;
let center = new Vector(0,0)
let horizontalPartitions = 1;
let lateralPartitions = 3;
let sectors = 80;
let mouse = new Vector(0,0)
let ramptime = 500
let deltaTime = 0.125;

let showForces = {
    osmosis: false,
    dampening: false, 
    spring: false,
    collision: false,
    stiffness: false,
}

//GLOBAL PARAMETERS
let edges = [];
let nodes = [];
let cells = [];

let charts = []

let animationId = null;
let frames = [];
let recordGif = false;
let time = 0;

let previousUpdateTime = -Infinity //used to time when to save data to charts, once every 50 frames 

//MODEL CREATION
let embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 0.2, largeRadius, smallRadius);
nodes = embryo.nodes
edges = embryo.edges
cells = embryo.cells


//MAIN PHYSICS AND RENDER LOOP
//THE PLACE FROM WHICH EVERYTHING IS CALCULATED
//draw is called every frame using requestAnimationFrame
function draw() {
    //for the gif
    if (recordGif){
        ctx.fillStyle = 'white';
        ctx.fillRect(-width/2, -height/2, width, height);
    }
    for(let i = 0; i<20; i++){ //for every frame, main update loop runs 20 times for speed
        ctx.clearRect(-width/2, -height/2, width, height)
        circle(center,largeRadius+1, false, undefined ,  true, 3)
        
        //Main logic
        //Hierarchy with cells containing edges and nodes, and edges containing nodes
        //each update function calls calculation of forces
        //the forces are not immediately applied, but recorded in the nodes
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
            //the move function sums up forces, and calculates change in velocity and position
            node.move();
            node.updatePosition(); //only used for mouse dragging
        }
        
        time += deltaTime;
        
        if (recordGif){ 
            let dataURL = canvas.toDataURL("image/png");
            frames.push(dataURL);
        }
        
        
        if(time - previousUpdateTime >= 50){
            recordData()
            previousUpdateTime = time
        }
        
        document.getElementById("time").innerHTML = `Time: ${time}`
    }
    
    animationId = requestAnimationFrame(draw);
}

//changes additional parameters such as starting constriction, see elements.js
setUpConstrictingCells() 
draw()

//TO CREATE A CHART, pass in the name, and a callback which returns info you want to record
createChart("Apical Depth",()=>nodes[0].getDistance())
createChart("Apical Length",()=>{
    let totalLength = 0
    for(let i = 0; i<lateralPartitions; i++){
        totalLength += cells[0].edges[i].getLength()
    }
    return totalLength
})
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
            },
        }
    });
    charts.push({chart:chart, query:query})
}


//EVERYTHING BELOW IS JUST IMPLEMENTATION DETAILS
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