// sketch.js - Experiment 2: Vector Art, Animation & Interactivity
// Author: Lyle Watkins
// Date: 1/21/2025

// Canvas variables
const htmlCanvas = document.getElementById("experiment");
const tileCount = 20;
let randSeed = 0;

// Control variables
let leftButton = false;
let circleMouseX, circleMouseY, rectMouseX, rectMouseY;

// Shape variables
const maxAlpha = 150;
const rectMod = 3;
const circleMod = 3;

// Sounds
let bongoLoop, tambourineLoop;

function preload() {
  bongoLoop = loadSound('./bongo_loop.mp3');
  tambourineLoop = loadSound('./tambourine_loop.mp3');
}

function modifySound(sound, x, y) {
  let volume = map(y, -height/2, height/2, 1.0, 0.0);
  sound.setVolume(volume);
  let playSpeed = map(x, -width/2, width/2, 0.0, 2.0);
  sound.rate(playSpeed);
}

function setup() {
  createCanvas(600, 600, P2D, htmlCanvas);
  strokeWeight(3);
  
  // Default values
  circleMouseX = 0;
  circleMouseY = 0;
  rectMouseX = 0;
  rectMouseY = 0;
  
  modifySound(bongoLoop, rectMouseX, rectMouseY);
  modifySound(tambourineLoop, circleMouseX, circleMouseY);
  
  bongoLoop.loop(true);
  tambourineLoop.loop(true);
}

function distanceToMouse(x, y) {
  return dist(x, y, mouseX, mouseY);
}

function drawCircle(gridX, gridY) {
  let circleMinColor = map(circleMouseX, -width/2, width/2, 255, 0);
  let circleAlpha = map(circleMouseY, -height/2, height/2, maxAlpha, 0);
  let r = random(circleMinColor, 256);
  let g = random(circleMinColor, 256);
  let b = random(circleMinColor, 256);
  let circleColor = color(r, g, b, circleAlpha);
  fill(circleColor);
  stroke(circleColor);
  
  let posX = (width / tileCount) * gridX + 15;
  let posY = (height / tileCount) * gridY  + 15;

  let shiftX = random(-circleMouseX, circleMouseX) / tileCount * circleMod;
  let shiftY = random(-circleMouseX, circleMouseX) / tileCount * circleMod;
  
  let x = posX + shiftX;
  let y = posY + shiftY;
  let distMod = map(distanceToMouse(x, y), 0, sqrt(width**2+height**2), 10, -20);
  let circleSize = map(circleMouseY, -height/2, height/2, 30, 1) + distMod;
  ellipse(x, y, circleSize, circleSize);
}

function drawRect(gridX, gridY) {
  let rectMinColor = map(rectMouseX, -width/2, width/2, 255, 0);
  let rectAlpha = map(rectMouseY, -height/2, height/2, maxAlpha, 0);
  let r = random(rectMinColor, 256);
  let g = random(rectMinColor, 256);
  let b = random(rectMinColor, 256);
  let rectColor = color(r, g, b, rectAlpha);
  fill(rectColor);
  stroke(rectColor);
  
  let posX = (width / tileCount) * gridX;
  let posY = (height / tileCount) * gridY;

  let shiftX1 = rectMouseX / tileCount * random(-1, 1) * rectMod;
  let shiftY1 = rectMouseY / tileCount * random(-1, 1) * rectMod;
  let shiftX2 = rectMouseX / tileCount * random(-1, 1) * rectMod;
  let shiftY2 = rectMouseY / tileCount * random(-1, 1) * rectMod;
  let shiftX3 = rectMouseX / tileCount * random(-1, 1) * rectMod;
  let shiftY3 = rectMouseY / tileCount * random(-1, 1) * rectMod;
  let shiftX4 = rectMouseX / tileCount * random(-1, 1) * rectMod;
  let shiftY4 = rectMouseY / tileCount * random(-1, 1) * rectMod;
  
  let distMod = map(distanceToMouse(posX, posY), 0, sqrt(width**2+height**2), 10, -20);
  let rectSize = map(rectMouseY, -height/2, height/2, 45, 1) + distMod;
  
  push();
  translate(posX, posY);
  beginShape();
  vertex(shiftX1, shiftY1);
  vertex(rectSize + shiftX2, shiftY2);
  vertex(rectSize + shiftX3, rectSize + shiftY3);
  vertex(shiftX4, rectSize + shiftY4);
  endShape();
  pop();
}

function drawGrid() {
  for (let gridY = 0; gridY < tileCount; gridY++) {
    for (let gridX = 0; gridX < tileCount; gridX++) {
      drawCircle(gridX, gridY);
      drawRect(gridX, gridY);
    }
  }
}

function draw() {
  background(0);
  randomSeed(randSeed);
  
  drawGrid();
  
  // Pan sound according to mouse X location
  let panDegree = map(mouseX, 0, width, -1.0, 1.0);
  panDegree = constrain(panDegree, -1.0, 1.0);
  tambourineLoop.pan(panDegree);
  bongoLoop.pan(panDegree);
}

function mousePressed(event) {
  if (event.button == 0) {
    leftButton = true;
  } else if (event.button == 2) {
    leftButton = false;
  }
}

function mouseDragged() {
  mouseX = constrain(mouseX, 0, width);
  mouseY = constrain(mouseY, 0, height);
  let centeredX = map(mouseX, 0, width, -width/2, width/2); // Adjust mouse X based on real center
  let centeredY = map(mouseY, 0, height, -height/2, height/2); // Adjust mouse Y based on real center
  
  if (leftButton) { // If the user is dragging with the left mouse button
    // Control the circles
    circleMouseX = lerp(circleMouseX, centeredX, 0.05);
    circleMouseY = lerp(circleMouseY, centeredY, 0.05);
    modifySound(tambourineLoop, circleMouseX, circleMouseY);
  } else { // If the user is dragging with the right mouse button
    // Control the rectangles
    rectMouseX = lerp(rectMouseX, centeredX, 0.05);
    rectMouseY = lerp(rectMouseY, centeredY, 0.05); 
    modifySound(bongoLoop, rectMouseX, rectMouseY);
  }
}

function keyReleased() {
  if (key == 's' || key == 'S') saveCanvas('sketch');
  if (key == 'r' || key == 'R') randSeed = random(100000);
}