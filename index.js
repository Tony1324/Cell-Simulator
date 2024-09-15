//CONSTANTS
window.largeRadius = 250;
window.smallRadius = largeRadius * 0.65;
window.center = new Vector(0,0)
window.horizontalPartitions = 1;
window.lateralPartitions = 3;
window.sectors = 80;
window.mouse = new Vector(0,0)
window.ramptime = 500
window.deltaTime = 1/8;
window.springConstant = 0.5;
window.stiffnessConstant = 3;
window.apicalConstrictionConstant = 0.3;
window.lateralConstrictionConstant = 0.1;
window.osmosisConstant = 0.005;
window.collisionConstant = 20;
window.gradient = [0.2, 0.22, 0.24, 0.30, 0.48, 0.6, 0.8, 0.8, 0.86, 0.9]

let runTime = 6000


let lastHoveredNode = null;
let hoveredNodeIndex = null;
let edgeIndexes = [];
let cellIndexes = [];

let showForces = {
    osmosis: false,
    dampening: false,
    spring: false,
    constriction: false,
    collision: false,
    stiffness: false,
}

//GLOBAL PARAMETERS
let edges = [];
let nodes = [];
let cells = [];
let round = 0; // Initialize round counter
let jsonDataList = [];

let charts = []

let animationId = null;
let time = 0;

let previousUpdateTime = -Infinity //used to time when to save data to charts, once every 50 frames

let embryo

function setup(){
    animationId = null;
    time = 0;
    previousUpdateTime = -Infinity //used to time when to save data to charts, once every 50 frames

    charts = []

    document.querySelector("#charts-container").innerHTML = ""
    //TO CREATE A CHART, pass in the name, and a callback which returns info you want to record
    createChart("Invagination Depth",()=>nodes[0].getDistance())
    createChart("Apical-Basal Length",()=>{
        let totalLength = 0
        for(let i = 0; i<lateralPartitions; i++){
            totalLength += cells[0].edges[i].getLength()
        }
        return totalLength
    })
    createChart("Apical Area",()=>cells[cells.length - 2].edges[0].getLength())
    createChart("Cell Volume",()=>cells[0].getArea())

    embryo = buildEmbryo(center, lateralPartitions, horizontalPartitions, sectors, 0, largeRadius, smallRadius);
    nodes = embryo.nodes
    edges = embryo.edges
    cells = embryo.cells

    //changes additional parameters such as starting constriction, see elements.js
    setUpConstrictingCells()
}

setup()

let parameters = {
    lateralConstrictionConstant: [0, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5],
    // springConstant: [0.05, 0.1, 0.5, 1, 2, 5, 10],
    // stiffnessConstant: [0.5, 1, 2,3, 5, 10, 20],
}

function permuteParametersList(parameters){
    let length = Object.keys(parameters).length
    if (length == 0){
        return [{}]
    }
    let permutations = []
    for (let x of parameters[Object.keys(parameters)[0]]){
        let otherParameters = {...parameters}
        delete otherParameters[Object.keys(parameters)[0]]
        let newPermutation = permuteParametersList(otherParameters)
        let newPermutations = newPermutation.map((perm) => {
            perm[Object.keys(parameters)[0]] = x
            return perm
        })
        permutations = permutations.concat(newPermutations)
    }
    return permutations
}

let parametersList = permuteParametersList(parameters)
let parameterIndex = 0

function runParameters(parameters){
    Object.assign(window, parameters)
    console.log(parameterIndex)
    console.log(parameters)
    setup()
}

if (parametersList.length > 0){
    runParameters(parametersList[parameterIndex])
    parameterIndex++
}


//MODEL CREATION

//MAIN PHYSICS AND RENDER LOOP
//THE PLACE FROM WHICH EVERYTHING IS CALCULATED

//draw is called every frame using requestAnimationFrame
function draw() {
    for(let i = 0; i<20; i++){ //for every frame, main update loop runs 20 times for speed
        ctx.clearRect(-width/2, -height/2, width, height)
        circle(center,largeRadius+1, false, undefined ,  true, 3)

        //Main logic
        //Hierarchy with cells containing edges and nodes, and edges containing nodes
        //each update function calls calculation of forces
        //the forces are not immediately applied, but recorded in the nodes

        for(let cell of cells) {
            if(i === 0) cell.draw()
            cell.update()
        }

        for(let edge of edges) {
            if(i === 0) edge.draw();
            edge.update();
        }

        for(let node of nodes) {
            if(i === 0)node.draw();
            node.update();

            //the move function sums up forces, and calculates change in velocity and position
            node.move();
        }

        if(time - previousUpdateTime >= 50){
            recordData()
            previousUpdateTime = time
        }
        time += deltaTime;

    }
    for(let cell of cells) {
        cell.draw()
    }

    for(let edge of edges) {
        edge.draw();
    }

    for(let node of nodes) {
        node.draw();
        //the move function sums up forces, and calculates change in velocity and position
        node.updatePosition(); //only used for mouse dragging
    }
    if (hoveredNodeIndex !== null) {
        ctx.font = "16px Arial"; // Choose font size and family
        ctx.fillStyle = "black"; // Choose text color
        ctx.fillText(`Node Index: ${hoveredNodeIndex}`, -100, -20); // Display node index

        ctx.fillText(`Edges: ${edgeIndexes.filter(index => index !== -1).join(", ")}`, -100, 0);
        ctx.fillText(`Cells: ${cellIndexes.join(", ")}`, -100, 20); // Display cell indexes
    }
    document.getElementById("time").innerHTML = `Time: ${time}`

    if(time >= runTime){
        let imageName = Object.entries(parametersList[parameterIndex-1]).map(([key, value]) => `${key}=${value}`).join("_")
        downloadCanvas(imageName + ".png")
        if(parametersList.length > parameterIndex){
            runParameters(parametersList[parameterIndex])
            parameterIndex++
        } else{
            cancelAnimationFrame(animationId)
            animationId = null;
            document.getElementById("play-pause-button").innerText = "Start"
        }
    }

    animationId = requestAnimationFrame(draw);
}


draw()

function downloadCanvas(name){
    //saves the canvas as a png
    var link = document.createElement('a');
    link.download = name;
    link.href = document.getElementById('canvas').toDataURL()
    link.click();
}

// Function to record and save data automatically
function autoSaveData() {

    let data = {
        cell: cells.map(cell => cell.getData()),  // Capture current cell data
        edge: edges.map(edge => edge.getData()),  // Capture current edge data
        node: nodes.map(node => node.getData())   // Capture current node data
    };
    let json = JSON.stringify(data, null, 2);


    // Save data with a unique filename for each round
    let filename = `data_round_${round}.json`;
    jsonDataList.push({
        filename: `data_round_${round}.json`,
        content: json
    });
    round++; // Increment round counter
}

// Function to record data
function recordData() {
    for (let { chart, query } of charts) {
        chart.data.labels.push(time);
        chart.data.datasets[0].data.push(query());
        chart.update();
    }

    // Auto-save every 100 frames (adjust as needed)
    autoSaveData();
}

function downloadLatestJSON() {
    if (jsonDataList.length === 0) {
        alert("No data available to download.");
        return;
    }

    const zip = new JSZip();

    jsonDataList.forEach((data) => {
        zip.file(data.filename, data.content);
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
        downloadFile('data_files.zip', content, 'application/zip');
    });
}

function downloadFile(filename, content, mimeType) {
    let blob = new Blob([content], { type: mimeType });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


function saveData(chart){
    downloadCSV(chartToCSV(chart), chart.data.datasets[0].label + '.csv');
}

function downloadCSV(csv, filename) {
    let blob = new Blob([csv], { type: "text/csv" });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


function chartToCSV(chart){
    let csv = "time, "+ chart.data.datasets[0].label + "\n"
    for(let i = 0; i<chart.data.labels.length;i++){
        let time = chart.data.labels[i]
        let value = chart.data.datasets[0].data[i]
        csv += time + "," + value + "\n"
    }
    return csv
}

function createChart(name, query){
    const chartElem = document.createElement("canvas")
    chartElem.id = 'chart' + charts.length
    const downloadButton = document.createElement("button")
    document.querySelector("#charts-container").appendChild(chartElem)
    downloadButton.id = "chart" + charts.length
    downloadButton.innerHTML = "download chart"
    document.querySelector("#charts-container").appendChild(downloadButton)
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
    downloadButton.onclick = () => {saveData(chart)}
}


//EVERYTHING BELOW IS JUST IMPLEMENTATION DETAILS

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

window.addEventListener("mousemove", (e) => {
    let pos = canvas.getBoundingClientRect()
    mouse.x = e.pageX - pos.left - document.documentElement.scrollLeft
    mouse.y = e.pageY - pos.top - document.documentElement.scrollTop

    // Check for node hover
    let nearestNode = null;
    let nearestDistance = Infinity;

    for(let node of nodes) {
        let d = Vector.dist(new Vector(mouse.x-width/2, mouse.y-height/2), node.pos);
        if (d < 10 && d < nearestDistance) {
            nearestDistance = d;
            nearestNode = node;
        }
    }

    // Reset hover state for all nodes
    for(let node of nodes) {
        node.hovered = false;
    }


    if (nearestNode) {
        if (nearestNode !== lastHoveredNode) {
            nearestNode.hovered = true;
            hoveredNodeIndex = nodes.indexOf(nearestNode);
            lastHoveredNode = nearestNode;
        }

        edgeIndexes = [];
        for(let edge of nearestNode.edges) {
            edgeIndexes.push(edges.indexOf(edge));
        }

        cellIndexes = [];
        for(let cell of nearestNode.cells) {
            cellIndexes.push(cells.indexOf(cell));
        }
    } else {
        hoveredNodeIndex = null;
        edgeIndexes = [];
        cellIndexes = [];
    }


});


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

document.getElementById('download-latest-json-button').addEventListener('click', downloadLatestJSON);

