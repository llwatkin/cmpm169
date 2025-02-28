// sketch.js - Experiment 5: Grammars & Text Art
// Author: Lyle Watkins
// Date: 2/17/2025

const htmlCanvas = document.getElementById("experiment");

// Constants
const CANVAS_WIDTH = 1025;
const CANVAS_HEIGHT = 625;
const PUCK_SIZE = 20;
const PEG_SIZE = 5;
const PEG_MASS = 10;
const PUCK_MASS = 0.6;
const PEG_SPACING = 25;
const BG_COLOR = 0;
const PEG_COLOR = {h: 0, s: 0, b: 30};
const TRIANGLE_COLOR = {h: 0, s: 0, b: 100};
const STROKE_WEIGHT = 2.5;
const TEXT_PADDING = 30;
const GRAVITY = 0.08;
const DROP_FREQ = 20;
const DRAG = 200;

// Globals
let pucks = [];
let pegs = [];
let triangles = [];
let buckets = [];

let dropCounter = 0;

function randomPosition() {
  let x = random(0 + PUCK_SIZE / 2, width - PUCK_SIZE / 2);
  return createVector(x, 0);
}

function randomColor() {
  let h = random(30, 50);
  return {h: h, s: 75, b: 100};
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, htmlCanvas);
  frameRate(60);
  strokeWeight(STROKE_WEIGHT);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  colorMode(HSB);
  
  // Create pegs
  let rows = width / PEG_SPACING;
  let cols = height / PEG_SPACING;
  let minX = PEG_SPACING - PEG_SPACING / 2;
  let maxX = rows * PEG_SPACING - PEG_SPACING / 2;
  let minY = PEG_SPACING - PEG_SPACING / 2;
  let maxY = cols * PEG_SPACING - PEG_SPACING / 2;
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      let pegPos = createVector(i * PEG_SPACING - PEG_SPACING / 2, j * PEG_SPACING - PEG_SPACING / 2);
      if (j % 2 == 0) pegPos.x += width / rows / 2;
      
      // Only add pegs if position is within allowed x and y coordinates
      if (pegPos.x > minX && pegPos.x < maxX && pegPos.y > minY && pegPos.y < maxY) {
        let peg = new Peg(pegPos, PEG_SIZE);
        pegs.push(peg);
      }
    }
  }
  
  // Create edge triangles
  for (let i = 2; i <= cols - 2; i+= 2) {
    // Left side triangle
    let triPos = createVector(PEG_SPACING - PEG_SPACING / 2, i * PEG_SPACING - PEG_SPACING / 2);
    let tri = new Triangle(triPos, false);
    triangles.push(tri);
    
    // Right side triangle
    triPos = createVector(rows * PEG_SPACING - PEG_SPACING / 2, i * PEG_SPACING - PEG_SPACING / 2);
    tri = new Triangle(triPos, true);
    triangles.push(tri);
  }
  
  // Create buckets
  // Bottom 50%
  let col = {h: 0, s: 75, b: 100};
  let pos = createVector(width / 2 - PEG_SPACING / 2, maxY - PEG_SPACING + PEG_SIZE);
  let bottom50 = new Bucket(pos, col, 1, "Bottom 50%", "2.5% of wealth");
  buckets.push(bottom50);
  
  // 50-90%
  col = {h: 20, s: 75, b: 100};
  pos = createVector(width / 2 - PEG_SPACING * 6.5, maxY - PEG_SPACING + PEG_SIZE);
  let _50to90Left = new Bucket(pos, col, 6, "50-90%", "30.8% of wealth");
  pos = createVector(width / 2 + PEG_SPACING / 2, maxY - PEG_SPACING + PEG_SIZE);
  let _50to90Right = new Bucket(pos, col, 6, "50-90%", "30.8% of wealth");
  buckets.push(_50to90Left);
  buckets.push(_50to90Right);
  
  // 90-99%
  col = {h: 50, s: 75, b: 100};
  pos = createVector(width / 2 - PEG_SPACING * 13.5, maxY - PEG_SPACING + PEG_SIZE);
  let _90to99Left = new Bucket(pos, col, 7, "90-99%", "36.5% of wealth");
  pos = createVector(width / 2 + PEG_SPACING * 6.5, maxY - PEG_SPACING + PEG_SIZE);
  let _90to99Right = new Bucket(pos, col, 7, "90-99%", "36.5% of wealth");
  buckets.push(_90to99Left);
  buckets.push(_90to99Right);
  
  // 99-99.9%
  col = {h: 120, s: 75, b: 100};
  pos = createVector(width / 2 - PEG_SPACING * 17.5, maxY - PEG_SPACING + PEG_SIZE);
  let _99to99Left = new Bucket(pos, col, 4, "99-99.9%", "16.7% of wealth");
  pos = createVector(width / 2 + PEG_SPACING * 13.5, maxY - PEG_SPACING + PEG_SIZE);
  let _99to99Right = new Bucket(pos, col, 4, "99-99.9%", "16.7% of wealth");
  buckets.push(_99to99Left);
  buckets.push(_99to99Right);
  
  // Top 0.1%
  col = {h: 220, s: 75, b: 100};
  pos = createVector(width / 2 - PEG_SPACING * 20.5, maxY - PEG_SPACING + PEG_SIZE);
  let topTenthLeft = new Bucket(pos, col, 3, "Top 0.1%", "13.5% of wealth");
  pos = createVector(width / 2 + PEG_SPACING * 17.5, maxY - PEG_SPACING + PEG_SIZE);
  let topTenthRight = new Bucket(pos, col, 3, "Top 0.1%", "13.5% of wealth");
  buckets.push(topTenthLeft);
  buckets.push(topTenthRight);
}

function draw() {
  background(BG_COLOR);
  
  // Title
  textSize(24);
  textFont('Georgia');
  stroke(PEG_COLOR.h, PEG_COLOR.s, PEG_COLOR.b);
  fill(255);
  text("U.S. Wealth Distribution in 2024", width / 2, 20);
  
  // Drop pucks every DROP_FREQ frames
  if (dropCounter == 0) {
    let puck = new Puck();
    pucks.push(puck);
    dropCounter = DROP_FREQ;
  }
  dropCounter--;
  
  for (let puck of pucks) {
    // Check puck-peg collisions
    for (let peg of pegs) dynamicStaticCircleCollision(puck, peg);
    
    // Check puck-wall collisions
    if (puck.pos.x < 0 + puck.rad) {
      puck.setPosition(0 + puck.rad, puck.pos.y);
      let n = createVector(1, 0);
      let newVel = p5.Vector.reflect(puck.vel, n);
      puck.bounce(newVel.x, newVel.y);
    } else if (puck.pos.x > width - puck.rad) {
      puck.setPosition(width - puck.rad, puck.pos.y);
      let n = createVector(-1, 0);
      let newVel = p5.Vector.reflect(puck.vel, n);
      puck.bounce(newVel.x, newVel.y);
    }
  }
  
  // Draw pegs
  for (let peg of pegs) peg.draw();
  
  // Draw buckets
  for (let bucket of buckets) bucket.draw();
  
  // Draw triangles
  for (let tri of triangles) tri.draw();
  
  // Update and draw pucks
  for (let puck of pucks) {
    puck.update();
    puck.draw();
  }
  
  // Remove pucks that have fallen off-screen
  for (let puck of pucks) {
    if (puck.pos.y > height + puck.rad) {
      let i = pucks.indexOf(puck);
      pucks.splice(i, 1);
    }
  }
}

function dynamicStaticCircleCollision(c1, c2) {
  if (c1.pos.dist(c2.pos) < c1.rad + c2.rad) {
    // Approximate new position of puck
    let yDir = (c1.pos.y - c2.pos.y) / abs(c1.pos.y - c2.pos.y);
    let overlap = c1.rad + c2.rad - c1.pos.dist(c2.pos);
    let y = c1.pos.y + yDir * overlap;

    c1.setPosition(c1.pos.x, y);

    // Calculate new velocity of c1
    let collisionDist = sqrt((c2.pos.x - c1.pos.x) ** 2 + (c2.pos.y - c1.pos.y) ** 2); 
    let nx = (c2.pos.x - c1.pos.x) / collisionDist;
    let ny = (c2.pos.y - c1.pos.y) / collisionDist;
    let p = 2 * (c1.vel.x * nx + c1.vel.y * ny);
    let vx = c1.vel.x - p * c1.mass * nx - p * c2.mass * nx / DRAG; 
    let vy = c1.vel.y - p * c1.mass * ny - p * c2.mass * ny / DRAG;

    c1.bounce(vx, vy);
  }
}

class Puck {
  constructor() {
    this.pos = randomPosition();
    this.rad = PUCK_SIZE / 2;
    this.vel = createVector(0, 0, 0);
    this.acc = createVector(0, GRAVITY, 0);
    this.rot = 0;
    this.aVel = 0;
    this.mass = PUCK_MASS;
    this.col = randomColor();
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.aVel = this.vel.x * 1.5;
    this.rot += this.aVel;
  }
  
  setPosition(x, y) {
    this.pos = createVector(x, y);
  }
  
  bounce(vx, vy) {
    this.vel = createVector(vx, vy);
  }
  
  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rot);
    stroke(this.col.h, this.col.s, this.col.b / 2);
    fill(this.col.h, this.col.s, this.col.b);
    circle(0, 0, this.rad * 2);
    textSize(12);
    text('$', 0, 0);
    pop();
  }
}

class Peg {
  constructor(pos, size) {
    this.pos = pos;
    this.rad = size / 2;
    this.col = PEG_COLOR;
    this.mass = PEG_MASS;
  }
  
  draw() {
    noStroke();
    fill(this.col.h, this.col.s, this.col.b);
    circle(this.pos.x, this.pos.y, this.rad * 2);
  }
}

class Triangle {
  constructor(pos, flipped) {
    this.pos = pos;
    let pegPos;
    if (flipped) {
      this.p1 = createVector(pos.x + PEG_SPACING / 2, pos.y);
      this.p2 = createVector(pos.x + PEG_SPACING / 2, pos.y + PEG_SPACING * 2);
      this.p3 = createVector(pos.x, pos.y + PEG_SPACING);
      
      // Set hidden peg position
      pegPos = createVector(this.pos.x + PEG_SPACING / 2, this.pos.y + PEG_SPACING);
    } else {
      this.p1 = createVector(pos.x - PEG_SPACING / 2, pos.y);
      this.p2 = createVector(pos.x - PEG_SPACING / 2, pos.y + PEG_SPACING * 2);
      this.p3 = createVector(pos.x, pos.y + PEG_SPACING);
      
      // Set hidden peg position
      pegPos = createVector(this.pos.x - PEG_SPACING / 2, this.pos.y + PEG_SPACING);
    }
    this.col = TRIANGLE_COLOR;
    
    // Add a hidden peg as a collider
    this.collider = new Peg(pegPos, PEG_SIZE * 5);
    pegs.push(this.collider);
  }
  
  draw() {
    noStroke();
    fill(this.col.h, this.col.s, this.col.b);
    triangle(this.p1.x, this.p1.y, this.p2.x, this.p2.y, this.p3.x, this.p3.y);
  }
}

class Bucket {
  constructor(pos, col, size, category, wealth) {
    this.pos = pos;
    this.col = col;
    this.size = size;
    this.category = category;
    this.wealth = wealth;
  }
  
  draw() {
    fill(this.col.h, this.col.s, this.col.b);
    stroke(BG_COLOR);
    rect(this.pos.x, this.pos.y, PEG_SPACING * this.size, PEG_SPACING * 3);
    if (mouseX > this.pos.x && mouseX < this.pos.x + PEG_SPACING * this.size) {
      if (mouseY > this.pos.y) {
        // Category heading
        let textPos = createVector(this.pos.x + PEG_SPACING * this.size / 2, this.pos.y - PEG_SPACING / 2 - TEXT_PADDING);
        if (this.pos.x == 0) textPos.x += TEXT_PADDING * 2;
        if (this.pos.x == width - PEG_SPACING * this.size) textPos.x -= TEXT_PADDING * 2;
        stroke(this.col.h, this.col.s, this.col.b / 2);
        text(this.category, textPos.x, textPos.y);
        
        // Wealth % subtext
        textPos.y += TEXT_PADDING;
        textSize(16);
        fill(255);
        stroke(PEG_COLOR.h, PEG_COLOR.s, PEG_COLOR.b);
        text("holds " + this.wealth, textPos.x, textPos.y);
      }
    }
  }
}