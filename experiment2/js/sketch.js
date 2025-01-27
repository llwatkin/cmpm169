// sketch.js - Experiment 3: Generative Methods
// Author: Lyle Watkins
// Date: 1/26/2025

const htmlCanvas = document.getElementById("experiment");

// Constants
const TREE_THICKNESS = 4;
const TREE_HEIGHT = 100;
const LENGTH_MOD = 0.66;
const MIN_LENGTH = 10;
const SYMMETRY = 3; // How many reflective sections in the canvas

// Branch globals
let branchAngle = 30;
let canvasAngle;
let spinSpeed = 1;

// Array of coordinates from which to draw trees
let canvasCoords;

// Sliders
let symmetrySlider;
let symmetry;
let zoomSlider;
let zoom;
let weightSlider;
let weight;

// Sound
let twistSound;

function preload() {
  twistSound = loadSound('twist.mp3');
}

function setup() {
  createCanvas(600, 600, P2D, htmlCanvas);
  colorMode(HSB);
  angleMode(DEGREES);
  strokeWeight(TREE_THICKNESS);
  
  // Define the array of coordinates from which to draw radial trees
  canvasCoords = [[width/2+TREE_HEIGHT*2, height/2-TREE_HEIGHT*2], 
                  [width/2-TREE_HEIGHT*2, height/2-TREE_HEIGHT*2], 
                  [width/2+TREE_HEIGHT*2, height/2+TREE_HEIGHT*2],
                  [width/2-TREE_HEIGHT*2, height/2+TREE_HEIGHT*2],
                  [width/2, height+TREE_HEIGHT], 
                  [width/2, -TREE_HEIGHT], 
                  [-TREE_HEIGHT, height/2], 
                  [width+TREE_HEIGHT, height/2], 
                  [width/2, height/2]];
  
  // Set up sliders
  symmetrySlider = document.getElementById("symmetry");
  symmetrySlider.value = SYMMETRY;
  zoomSlider = document.getElementById("zoom");
  zoomSlider.value = TREE_HEIGHT;
  weightSlider = document.getElementById("weight");
  weightSlider.value = TREE_THICKNESS;
  
  // Play sound
  twistSound.setVolume(0.2);
  twistSound.loop(true);
}

function draw() {
  background(0);
  
  branchAngle += (0.1 * spinSpeed);
  symmetry = symmetrySlider.value;
  zoom = zoomSlider.value;
  weight = weightSlider.value;
  canvasAngle = 360/symmetry;
  
  strokeWeight(weight);
  
  for (let i = 0; i < canvasCoords.length; i++) {
    let coords = canvasCoords[i];
    push();
    translate(coords[0], coords[1]);
    if (i == 0 || i == 3) { // If top right or bottom left
      rotate(45);
    } else if (i == 1 || i == 2) { // If top left or bottom right
      rotate(-45);
    }
    drawTrees();
    pop();
  }
}

function mouseMoved() {
  mouseX = constrain(mouseX, 0, width);
  if (mouseX < width/2) { // If the mouse is on the left
    spinSpeed = map(mouseX, 0, width/2, -20, 0);
    let playSpeed = map(spinSpeed, -20, 0, 2.0, 0);
    twistSound.rate(playSpeed);
  } else { // If the mouse is on the right
    spinSpeed = map(mouseX, width/2, width, 0, 20);
    let playSpeed = map(spinSpeed, 0, 20, 0, 2.0);
    twistSound.rate(playSpeed);
  } 
}

function drawTrees() {
  for (let i = 0; i < symmetry; i++) { // For each reflective section...
    
    // ...draw initial tree...
    push();
    // Draw the trunk of the tree
    stroke(0, 255, 255);
    line(0, 0, 0, -zoom);
    // Move to the end of that line
    translate(0, -zoom);
    // Start the recursive branching
    branch(zoom, 0);
    pop();
    
    // ...and draw its reflection
    push();
    // Draw the trunk of the tree
    stroke(0, 255, 255);
    line(0, 0, 0, -zoom);
    // Move to the end of that line
    translate(0, -zoom*2);
    rotate(180);
    // Start the recursive branching
    branch(zoom, 0);
    pop();
    
    rotate(canvasAngle);
  }
}

function branch(h, level) {
  // Set the hue based on the recursion level
  stroke(level * 50, 255, 255);
  
  // Set new branch length
  h *= LENGTH_MOD;
  // Set new branch width
  strokeWeight(weight - level/3);

  // Draw if our branch length > minimum, otherwise stop the recursion
  if (h > MIN_LENGTH) {
    // -- Draw the right branch -- //
    push();
    rotate(branchAngle);
    line(0, 0, 0, -h);
    translate(0, -h); // Move to the end of the branch
    branch(h, level + 1); // Recursive call
    pop();
    
    //  -- Draw the left branch -- //
    push();
    rotate(-branchAngle);
    line(0, 0, 0, -h);
    translate(0, -h); // Move to the end of the branch
    branch(h, level + 1); // Recursive call
    pop();
  }
}

function keyReleased() {
  if (key == 's' || key == 'S') saveCanvas('sketch');
}