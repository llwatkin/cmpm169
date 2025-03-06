// sketch.js - Experiment 5: Grammars & Text Art
// Author: Lyle Watkins
// Date: 2/17/2025

const htmlCanvas = document.getElementById("experiment");

// Constants
const SIZE = 15;
const CHARS = ["-", "•", "+", "o", "0", "O", "●", "⬤"];
const STORM_CHANCE_FREQ = 3600; // # of frames in between random rain frequency change
const MIN_RAIN_FREQ = 1;
const MAX_RAIN_FREQ = 120; // maximum # of frames rainFreq can be
const SUN_CHANGE_SPEED = 0.005;

// Globals
let pond;
let rainFreq = 120; // maximum # of frames in between drops
let rainCounter = 0;
let stormCounter = 0;
let sunLevel = 80;
let goalSunLevel = sunLevel;

// Sounds
let ambiance;
let water;

function preload() {
  ambiance = loadSound('ambiance.mp3');
  water = loadSound('water.mp3');
}

function setup() {
  createCanvas(1200, 600, htmlCanvas);
  colorMode(HSB);
  frameRate(60);
  noStroke();
  textFont("Century Schoolbook", SIZE);
  
  ambiance.setVolume(0.25);
  ambiance.loop(true);
  water.setVolume(0);
  water.loop(true);

  pond = new Pond();
}

function draw() {
  sunLevel = lerp(sunLevel, goalSunLevel, SUN_CHANGE_SPEED);
  background(200, 100, sunLevel);
  fill(200, constrain(sunLevel - 40, 0, 40), sunLevel + 20);
  pond.draw();
  
  if (rainCounter <= 0) {
    pond.dropDroplet({x: random(0, width), y: random(0, height)});
    rainCounter = random(1, rainFreq);
  }
  rainCounter--;
  
  if (stormCounter <= 0) {
    rainFreq = random(MIN_RAIN_FREQ, MAX_RAIN_FREQ);
    stormCounter = STORM_CHANCE_FREQ;
    
    // Calculate new goal sun level
    goalSunLevel = map(rainFreq, MIN_RAIN_FREQ, MAX_RAIN_FREQ, 20, 80);
  }
  stormCounter--;
}

class Pond {
  constructor() {
    this.data = new Array(width/SIZE*height/SIZE).fill().map(_ => 0);
    this.ripples = [];
    this.droplets = [];
  }
  
  dropDroplet(pos) {
    let droplet = new Droplet(createVector(pos.x, pos.y));
    this.droplets.push(droplet);
    
    this.createRipple(pos);
  }
  
  createRipple(pos) {
    let ripple = {pos: createVector(pos.x, pos.y), size: 1, thresh: 0.5};
    this.ripples.push(ripple);
  }
  
  updateRipples() {
    for (let ripple of this.ripples) {
      ripple.size += 1;
      ripple.thresh += 0.002;
      
      // Remove ripples once they have disappeared
      if (ripple.thresh >= 1) {
        let index = this.ripples.indexOf(ripple);
        this.ripples.splice(index, 1);
      }
    }
  }
  
  updateDroplets() {
    // Remove droplets once they are too small
    for (let droplet of this.droplets) {
      if (droplet.size < 0) {
        let index = this.droplets.indexOf(droplet);
        this.droplets.splice(index, 1);
      }
    }
  }
  
  updateWaterSound() {
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i];
    let volume = map(sum, 0, this.data.length * CHARS.length, 0, 1);
    water.setVolume(volume);
  }
  
  draw() {
    for(let i = 0; i < this.data.length; i ++){
      text(CHARS[this.data[i]], i % (width/SIZE) * SIZE, Math.floor(i / (width/SIZE)) * SIZE);
      let pointPos = createVector(i % (width/SIZE) * SIZE, Math.floor(i / (width/SIZE)) * SIZE);
      this.data[i] = 0; // All data initialized to 0
      
      // Update ripple data
      for (let ripple of this.ripples) {
        let distance = ripple.pos.dist(pointPos) / ripple.size;
        if (distance < 1 && distance > ripple.thresh) this.data[i] += 1;
      }
      if (this.data[i] > CHARS.length - 1) this.data[i] = CHARS.length - 1;
	}
    this.updateRipples();
    this.updateWaterSound();
    
    // Draw and update droplets
    for (let droplet of this.droplets) droplet.draw();
    this.updateDroplets();
  }
}

class Droplet {
  constructor(pos) {
    this.pos = pos;
    this.size = 15;
    this.speed = 0.5;
  }
  
  draw() {
    circle(this.pos.x, this.pos.y, this.size);
    this.size -= this.speed;
    this.speed += 0.1;
  }
}

function mouseClicked() {
	pond.dropDroplet(createVector(mouseX, mouseY));
}