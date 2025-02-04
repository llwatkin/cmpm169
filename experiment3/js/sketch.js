// sketch.js - Experiment 3: Images, Video, & Sound Art
// Author: Lyle Watkins
// Date: 2/3/2025

const htmlCanvas = document.getElementById("experiment");

// Constants
const CANVAS_SIZE = 600;
const PIECE_COLS = 3;
const PIECE_ROWS = 4;
const PUZZLE_WIDTH = 270;
const PUZZLE_HEIGHT = 400;
const SNAP_FIDELITY = 20;
const UPDATE_FREQ = 10; // # of frames between puzzle image updates
const BREAK_FREQ = 360; // # of frames between random pieces breaking off
const MIN_BREAK_DIST = 150; // The minimum distance a piece will travel when broken off
const SHATTER_CHANCE = 0; // Base % chance the entire puzzle shatters

// Globals
let mouse;
let puzzle;
let capture;
let shattered = false;

// Counters
let updateCounter = 0;
let breakCounter = BREAK_FREQ;

// Sounds
let click;
let thump;
let pickUp;
let heartbeat;
let glitch;
let breakk;
let shatter;

function preload() {
  click = loadSound('click.mp3');
  thump = loadSound('thump.mp3');
  pickUp = loadSound('pick-up.mp3');
  heartbeat = loadSound('heartbeat.mp3');
  glitch = loadSound('glitch.mp3');
  breakk = loadSound('break.mp3');
}

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE, htmlCanvas);
  frameRate(60);
  strokeWeight(1);
  stroke(255);
  noFill();
  
  let constraints = {
    video: {
      mandatory: {
        minWidth: PUZZLE_WIDTH,
        minHeight: 0
      }
    },
    audio: false,
    flipped: true
  };

  capture = createCapture(constraints);
  capture.hide();
  
  mouse = new Mouse();
  puzzle = new Puzzle(capture, PIECE_COLS, PIECE_ROWS);
  
  // Sound effects
  click.setVolume(0.5);
  thump.setVolume(0.1);
  pickUp.setVolume(0.2);
  
  // Background loops
  heartbeat.setVolume(0);
  heartbeat.rate(0.8);
  heartbeat.loop(true);
  glitch.setVolume(0);
  glitch.rate(0.1);
  glitch.loop(true);
}

function draw() {
  background(0);
  translate(width/2, height/2);
  
  // Update puzzle image every UPDATE_FREQ frames
  if (updateCounter <= 0) {
    puzzle.setImg(capture);
    updateCounter = UPDATE_FREQ;
  }
  updateCounter--;
  
  // Update sounds according to puzzle wrongness
  let wrongness = puzzle.getWrongness();
  updateSounds(wrongness);
  
  // Break a piece off or shatter every BREAK_FREQ frames
  // Break frequency increases the higher the puzzle's wrongness
  if (breakCounter <= 0) {
    // Determine is puzzle is shatterable
    if (puzzle.isShatterable()) shattered = false;
    
    // Determine if piece will break off or entire puzzle shatters
    let maxWrongness = PIECE_COLS*PIECE_ROWS*SNAP_FIDELITY*2;
    let wrongnessMod = map(wrongness, 0, maxWrongness, 0, 100);
    wrongnessMod = constrain(wrongnessMod, 0, 100);
    let chance = random(0, 100);
    if (chance <= SHATTER_CHANCE + wrongnessMod && !shattered) {
      puzzle.shatter();
      shattered = true;
    } else puzzle.break();

    // Caluclate new break frequency
    maxWrongness = PIECE_COLS*PIECE_ROWS*SNAP_FIDELITY/2;
    wrongnessMod = map(wrongness, 0, maxWrongness, 0, 240);
    wrongnessMod = constrain(wrongnessMod, 0, 240);
    breakCounter = BREAK_FREQ - wrongnessMod;
  }
  breakCounter--;
  
  puzzle.draw();
}

function updateSounds(wrongness) {
  let maxWrongness = PIECE_COLS*PIECE_ROWS*SNAP_FIDELITY;
  // Heartbeat
  let heartbeatVolume = map(wrongness, 0, maxWrongness, 0, 1);
  heartbeatVolume = constrain(heartbeatVolume, 0, 5);
  heartbeat.setVolume(heartbeatVolume);
  // Glitch
  let glitchVolume = map(wrongness, 0, maxWrongness, 0, 0.1);
  glitchVolume = constrain(glitchVolume, 0, 0.5);
  glitch.setVolume(glitchVolume);
}

class Mouse {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.piece = undefined; // Keep track of currently-held piece
  }
  
  getCoords() {
    // Adjust mouse coordinates to actual canvas center
    this.x = map(mouseX, 0, width, -width/2, width/2);
    this.y = map(mouseY, 0, height, -height/2, height/2);
  }
}

class Puzzle {
  constructor(img, cols, rows) {
    this.pieces = [];
    this.grid = [];
    
    // Create cols x rows pieces from input img
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let w = round(PUZZLE_WIDTH/cols);
        let h = round(PUZZLE_HEIGHT/rows);
        let imgX = i*w + img.width/1.65;
        let imgY = j*h;
        let x = i*w - PUZZLE_WIDTH/2;
        let y = j*h - PUZZLE_HEIGHT/2;
        let piece = new Piece(img, imgX, imgY, x, y, w, h);
        this.pieces.push(piece);
        this.grid.push({x:x, y:y, w:w, h:h});
      }
    }
  }
  
  getWrongness() {
    let wrongness = 0;
    for (let piece of this.pieces) {
      wrongness += piece.wrongness;
    }
    return wrongness;
  }
  
  setImg(img) {
    for (let piece of this.pieces) {
      piece.setImg(img);
    }
  }
  
  pieceAt(x, y) {
    for (let piece of this.pieces) {
      if (piece.x == x && piece.y == y) {
        if (piece != mouse.piece) {
          return true;
        }
      }
    }
    return false;
  }
  
  piecesInGrid() {
    // Returns an array of all pieces snapped to the grid
    let pieces = [];
    for (let piece of this.pieces) if (piece.snapped) pieces.push(piece);
    return pieces;
  }
  
  break() {
    // Pick a random piece from pieces in the grid to break off
    let pieces = this.piecesInGrid();
    if (pieces.length > 0) {
      let piece = random(pieces);
      piece.break();
    }
  }
  
  isShatterable() {
    let pieces = this.piecesInGrid();
    if (pieces.length > PIECE_COLS*PIECE_ROWS/2) return true;
    return false;
  }
  
  shatter() {
    // Break off all pieces
    let pieces = this.piecesInGrid();
    for (let piece of pieces) piece.break();
  }

  draw() {
    for (let piece of this.pieces) piece.draw();
  }
}

class Piece {
  constructor(img, imgX, imgY, x, y, w, h) {
    this.imgX = imgX;
    this.imgY = imgY;
    this.ogX = x;
    this.ogY = y;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // Other variables
    this.goalPos = {x:x, y:y};
    this.snapped = true;
    this.wrongness = 0;
    // Piece image
    this.img = createImage(this.w, this.h);
    this.setImg(img);
  }
  
  calcWrongness() {
    let ogCenter = {x: this.ogX+this.w/2, y: this.ogY+this.h/2};
    let currCenter = {x: this.x+this.w/2, y: this.y+this.h/2};
    this.wrongness = dist(ogCenter.x, ogCenter.y, currCenter.x, currCenter.y);
  }
  
  setImg(img) {
    // Get region of the image for this piece
    let maxWrongness = CANVAS_SIZE;
    let wrongnessMod = map(this.wrongness, 0, maxWrongness, 0, 50);
    let xMod = random(-1, 1) * wrongnessMod;
    let yMod = random(-1, 1) * wrongnessMod;
    this.img = img.get(this.imgX + xMod, this.imgY + yMod, this.w, this.h);
  }
  
  toFront() {
    // Re-order puzzle array to draw this piece above every other piece
    puzzle.pieces.splice(puzzle.pieces.indexOf(this), 1);
    puzzle.pieces.push(this);
    pickUp.play();
  }
  
  toBack() {
    // Re-order puzzle array to draw this piece below every other piece
    puzzle.pieces.splice(puzzle.pieces.indexOf(this), 1);
    puzzle.pieces.unshift(this);
    click.play();
  }
  
  lift() {
    mouse.piece = this;
    this.toFront();
    this.snapped = false;
    this.goalPos = {x:this.x, y:this.y};
  }
  
  drag() {
    this.x = mouse.x - this.w/2;
    this.x = constrain(this.x, -width/2, width/2 - this.w);
    this.y = mouse.y - this.h/2;
    this.y = constrain(this.y, -height/2, height/2 - this.h);
    this.goalPos = {x:this.x, y:this.y};
  }
  
  snap() {
    for (let r of puzzle.grid) {
      let rCenter = {x: r.x+r.w/2, y: r.y+r.h/2};
      let pCenter = {x: this.x+this.w/2, y: this.y+this.h/2};
      let d = dist(rCenter.x, rCenter.y, pCenter.x, pCenter.y);
      if (d <= SNAP_FIDELITY) {
        if (!puzzle.pieceAt(r.x, r.y)) { // If there is no piece (other than this one) at this spot
          this.x = r.x;
          this.y = r.y;
          this.toBack();
          this.snapped = true;
        }
      }
    }
    thump.play();
  } 
  
  break() {
    // Pick a random (x, y) location at least MIN_BREAK_DIST distance away 
    let randPos = {x:this.x, y:this.y};
    do {
      let randX = random(-width/2, width/2 - this.w);
      let randY = random(-height/2, height/2 - this.h);
      randPos = {x:randX, y:randY};
    } while (dist(randPos.x, randPos.y, this.x, this.y) < MIN_BREAK_DIST);
    
    // Set goal location
    this.goalPos = {x:randPos.x, y:randPos.y};
    
    // Make sure piece is in front and unsnapped
    this.toFront();
    this.snapped = false;
    
    breakk.play();
  }
  
  draw() {
    this.x = lerp(this.x, this.goalPos.x, 0.05);
    this.y = lerp(this.y, this.goalPos.y, 0.05);
    this.calcWrongness();
    image(this.img, this.x, this.y);
  }
}

function mouseWithin(piece) {
  // Check whether mouse is within the bounds of the input piece
  if (mouse.x > piece.x &&
      mouse.x < piece.x + piece.w &&
      mouse.y > piece.y &&
      mouse.y < piece.y + piece.h) {
    return true;
  }
  return false;
}

function mousePressed() {
  mouse.getCoords();
  for (let i = puzzle.pieces.length-1; i >= 0; i--) {
    let piece = puzzle.pieces[i];
    if (mouseWithin(piece)) {
      piece.lift();
      break;
    }
  }
}

function mouseDragged() {
  mouse.getCoords();
  if (mouse.piece) mouse.piece.drag();
}

function mouseReleased() {
  if (mouse.piece) {
    mouse.piece.snap();
    mouse.piece = undefined;
  }
}