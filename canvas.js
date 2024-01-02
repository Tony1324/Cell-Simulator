
const canvas = document.querySelector("canvas")
canvas.ontouchstart = (e)=>{e.preventDefault()}
const ctx = canvas.getContext('2d', { willReadFrequently: true });

if (window.devicePixelRatio > 1) {
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

const width = canvas.width/window.devicePixelRatio
const height = canvas.height/window.devicePixelRatio

ctx.translate(width/2, height/2)



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


