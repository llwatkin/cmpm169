// sketch.js - Experiment 4: 3D Graphics
// Author: Lyle Watkins
// Date: 2/10/2025

const htmlCanvas = document.getElementById("experiment");

const INIT_DISTANCE = 150; // Initial distance from center
const BOX_SIZE = 400;
const NUM_BODIES = 3;
const G = 6.67e-11; // Gravitational constant
const MASS = 10e12;
const SCALE = 1e-5;
const SPEED = 0.05;
const DAMPEN = 0.8;

let simulation;

let drone;
let clink;
let noteA;
let noteB;
let noteC;
let noteD;
let noteE;

let notes;

function preload() {
  drone = loadSound('drone.mp3');
  clink = loadSound('clink.mp3');
  noteA = loadSound('noteA.mp3');
  noteB = loadSound('noteB.mp3');
  noteC = loadSound('noteC.mp3');
  noteD = loadSound('noteD.mp3');
  noteE = loadSound('noteE.mp3');
}

function setup() {
  createCanvas(600, 600, WEBGL, htmlCanvas);
  layer = createFramebuffer();
  background(0);
  frameRate(60);
  angleMode(DEGREES);
  noStroke();
  colorMode(HSB);
  
  drone.setVolume(0.2);
  clink.setVolume(0.5);
  
  drone.loop(true);
  
  notes = [noteA, noteB, noteC, noteD, noteE];
  simulation = new Simulation();
}

function draw() {
  background(0);

  simulation.step();
  simulation.draw();
  
  // Draw cube
  push();
  noFill();
  stroke(255);
  strokeWeight(3);
  box(BOX_SIZE, BOX_SIZE, BOX_SIZE);
  pop();
  
  orbitControl();
}

class Simulation {
  constructor() {
    this.bodies = [];
    this.ripples = [];
    
    // Create bodies
    let pos = createVector(random(-1, 1), random(-1, 1), 0).setMag(INIT_DISTANCE); // Initial position
    let vel = createVector(random(-0.5, 0.5), 0, 0); // Initial velocity
    for (let i = 0; i < NUM_BODIES; i++) {
      // Choose a random note and remove it from the notes array
      let randNote = random(notes);
      notes.splice(notes.indexOf(randNote), 1);
      
      // Create body and add it to bodies array
      let body = new Body(MASS, pos, vel, {h: i * 360 / NUM_BODIES, s: 100, b: 100}, randNote);
      this.bodies.push(body);
      
      // Rotate position and velocity to get next body's position and velocity
      pos = p5.Vector.rotate(pos, 360 / NUM_BODIES).setMag(INIT_DISTANCE);
      pos.z = random(-INIT_DISTANCE, INIT_DISTANCE);
      vel = p5.Vector.rotate(vel, 360 / NUM_BODIES);
    }
  }
  
  step() {
    for (let body1 of this.bodies) {
      // Apply force of other bodies to this body
      let f = createVector(0, 0, 0);
      for (let body2 of this.bodies) {
        if (body1 != body2) {
          // Calculate gravitational force according to inverse-square law
          let r = body1.pos.dist(body2.pos);
          let rx = body2.pos.x - body1.pos.x;
          let ry = body2.pos.y - body1.pos.y;
          let rz = body2.pos.z - body1.pos.z;
          let fx = G * (body1.mass * body2.mass / r ** 2) * (rx / abs(rx));
          let fy = G * (body1.mass * body2.mass / r ** 2) * (ry / abs(ry));
          let fz = G * (body1.mass  *body2.mass / r ** 2) * (rz / abs(rz));
          // Only add force if bodies are not touching
          if (r > body1.rad + body2.rad) f.add(createVector(fx, fy, fz)); 
        }
      }
      body1.applyForce(f);
    }
    
    for (let body of this.bodies) {
      body.update();
      this.wallCheck(body);
    }
  }
  
  wallCheck(body) {
    let ripple;
    let col = {h: body.col.h, s: body.col.s, b: body.col.b};
    
    // Left wall
    if (body.pos.x - body.rad < -BOX_SIZE/2) {
      let nx = -1;
      let p = 2 * (body.vel.x * nx) / body.mass;
      let vx = body.vel.x - p * body.mass * nx;
      let d = abs(-BOX_SIZE/2 - (body.pos.x - body.rad));
      body.pos.x += d;
      body.bounce(createVector(vx * DAMPEN, body.vel.y, body.vel.z));
      // Create ripple effect
      ripple = new Ripple(createVector(-BOX_SIZE/2, body.pos.y, body.pos.z), "y", 90, col);
    }
    
    // Top wall
    if (body.pos.y - body.rad < -BOX_SIZE/2) {
      let ny = -1;
      let p = 2 * (body.vel.y * ny) / body.mass;
      let vy = body.vel.y - p * body.mass * ny;
      let d = abs(-BOX_SIZE/2 - (body.pos.y - body.rad));
      body.pos.y += d;
      body.bounce(createVector(body.vel.x, vy * DAMPEN, body.vel.z));
      // Create ripple effect
      ripple = new Ripple(createVector(body.pos.x, -BOX_SIZE/2, body.pos.z), "x", 90, col);
    }
    
    // Back wall
    if (body.pos.z - body.rad < -BOX_SIZE/2) {
      let nz = -1;
      let p = 2 * (body.vel.z * nz) / body.mass;
      let vz = body.vel.z - p * body.mass * nz;
      let d = abs(-BOX_SIZE/2 - (body.pos.z - body.rad));
      body.pos.z += d;
      body.bounce(createVector(body.vel.x, body.vel.y, vz * DAMPEN));
      // Create ripple effect
      ripple = new Ripple(createVector(body.pos.x, body.pos.y, -BOX_SIZE/2), "x", 0, col);
    }
    
    // Right wall
    if (body.pos.x + body.rad > BOX_SIZE/2) {
      let nx = 1;
      let p = 2 * (body.vel.x * nx) / body.mass;
      let vx = body.vel.x - p * body.mass * nx;
      let d = (body.pos.x + body.rad) - BOX_SIZE/2;
      body.pos.x -= d;
      body.bounce(createVector(vx * DAMPEN, body.vel.y, body.vel.z));
      // Create ripple effect
      ripple = new Ripple(createVector(BOX_SIZE/2, body.pos.y, body.pos.z), "y", 90, col);
    }
    
    // Bottom wall
    if (body.pos.y + body.rad > BOX_SIZE/2) {
      let ny = 1;
      let p = 2 * (body.vel.y * ny) / body.mass;
      let vy = body.vel.y - p * body.mass * ny;
      let d = (body.pos.y + body.rad) - BOX_SIZE/2;
      body.pos.y -= d;
      body.bounce(createVector(body.vel.x, vy * DAMPEN, body.vel.z));
      // Create ripple effect
      ripple = new Ripple(createVector(body.pos.x, BOX_SIZE/2, body.pos.z), "x", 90, col);
    }
    
    // Front wall
    if (body.pos.z + body.rad > BOX_SIZE/2) {
      let nz = 1;
      let p = 2 * (body.vel.z * nz) / body.mass;
      let vz = body.vel.z - p * body.mass * nz;
      let d = (body.pos.z + body.rad) - BOX_SIZE/2;
      body.pos.z -= d;
      body.bounce(createVector(body.vel.x, body.vel.y, vz * DAMPEN));
      // Create ripple effect
      ripple = new Ripple(createVector(body.pos.x, body.pos.y, BOX_SIZE/2), "", 0, col);
    }
    
    if (ripple) this.ripples.push(ripple);
  }
  
  draw() {
    for (let ripple of this.ripples) ripple.draw();
    for (let body of this.bodies) body.draw();
    
    // If ripple has disappeared, remove it from the array
    for (let ripple of this.ripples) {
      if (ripple.col.b <= 0) {
        let i = this.ripples.indexOf(ripple);
        this.ripples.splice(i, 1);
      }
    }
  }
}

class Body {
  constructor(mass, pos, vel, col, note) {
    this.pos = pos;
    this.vel = vel;
    this.acc = createVector(0, 0, 0);
    this.mass = mass;
    this.rad = sqrt(this.mass / PI) * SCALE;
    this.path = [];
    this.col = col;
    this.note = note;
    
    this.path.push(createVector(this.pos.x, this.pos.y, this.pos.z));
  }
  
  // Apply force according to Newton's 2nd law: F = M * A (A = F / M)
  applyForce(f) {
    this.acc.add(p5.Vector.div(f, this.mass));
  }
  
  bounce(vel) {
    this.vel = vel;
    this.acc.set(0, 0, 0);
    clink.play();
    this.note.play();
  }
  
  update() {
    let deltaVel = p5.Vector.mult(this.acc, deltaTime * SPEED);
    this.vel.add(deltaVel); // Change velocity by acceleration
    this.pos.add(p5.Vector.mult(this.vel, deltaTime * SPEED)); // Change position by velocity
    this.acc.set(0, 0, 0); // Reset acceleration each frame
    this.addToPath();
  }
  
  addToPath() {
    this.path.push(createVector(this.pos.x, this.pos.y, this.pos.z));
    if (this.path.length > round(this.rad * 2)) this.path.shift();
  }
  
  draw() {
    // Draw path
    push();
    let weight = this.rad;
    let b = this.col.b;
    for (let i = this.path.length - 1; i > 0; i--) {
      strokeWeight(weight);
      stroke(this.col.h, this.col.s, b);
      let p1 = this.path[i];
      let p2 = this.path[i - 1];
      line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      weight -= this.rad / this.path.length;
      b -= 2;
    }
    pop();
    
    // Draw sphere
    push();
    fill(this.col.h, this.col.s, this.col.b);
    translate(this.pos.x, this.pos.y, this.pos.z);
    sphere(this.rad);
    pop();
  }
}

class Ripple {
  constructor(pos, dim, rot, col) {
    this.pos = pos;
    this.dim = dim;
    this.rot = rot;
    this.col = col;
    this.rad = 1;
  }
  
  draw() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    if (this.dim == "x") {
      rotateX(this.rot);
    } else if (this.dim == "y") {
      rotateY(this.rot);
    }
    stroke(this.col.h, this.col.s, this.col.b);
    strokeWeight(5);
    noFill();
    circle(0, 0, this.rad);
    pop();
    
    this.rad += 4;
    this.col.b -= 4;
  }
}