/*
Author:	L05
Date:	2019.08.17

This sketch is intended to be run on mobile.
It sends the a basic joystick and button output to a node server
via socket.io.

Run http-server -c-1 to start server. This will default to port 8080.
Run http-server -c-1 -p80 to start server on open port 80.

*/

// Initialize variables

const sendInterval  = 100;					// in milliseconds
// Socket Network Settings
// const serverIp      = 'https://p5cc-play.herokuapp.com';
// const serverIp      = '192.168.1.131';
// const serverPort    = '3000';                 // Server port
const serverIp      = '127.0.0.1';
const serverPort    = '3000';

let socket;
let isTouching	= false;
let isAttached	= true;

let gui         = null;
let joystick    = null;
let thisJ       = {x: 0, y: 0};
let prevJ       = {x: 0, y: 0};
let divs        = 4;
let button      = null;

let playerColor;
let playerColorDim;
let id = null;
let roomId = null;
let waiting = true;
let connected = false;

////////////////////////////////////////
////////////////////////////////////////


////////////
// Setup
function setup() {
  createCanvas(windowWidth, windowHeight);
  processUrl();
  
  gui = createGui();

  setPlayerColors();
  setupUI();

  // Socket.io - open a connection to the web server on specified port
  // socket = io.connect(serverIp);
  socket = io.connect(serverIp + ':' + serverPort);

  socket.emit('join', {name: 'client', roomId: roomId});

  socket.on('id', function(data) {
    id = data;
    console.log("id: " + id);
  });

  socket.on('found', function(data) {
    connected = data.status;
    waiting = false;
    console.log("connected: " + connected);
  })
  
  socket.emit('clientConnect', {
    roomId: roomId,
    r: red(playerColor)/255,
    g: green(playerColor)/255,
    b: blue(playerColor)/255
  });
} 

function processUrl() {
  const parameters = location.search.substring(1).split("&");

  const temp = parameters[0].split("=");
  roomId = unescape(temp[1]);

  console.log("id: " + roomId);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

////////////
// Draw loop
function draw() {
  background(0);

  // If no connection is detected, print error message.
  if (waiting) {
    push();
      fill(200);
      textAlign(CENTER, CENTER);
      textSize(20);
      text("Attempting connection...", width/2, height/2-10);
      // text("bottom of the game screen.", width/2, height/2+10);
    pop();
    return;
  } 
  else if (!connected) {
    push();
      fill(200);
      textAlign(CENTER, CENTER);
      textSize(20);
      text("Please enter the link at the", width/2, height/2-10);
      text("bottom of the game screen.", width/2, height/2+10);
    pop();
    return;
  }
  else {
    drawGui();
  }
}

////////////
// GUI setup
function setPlayerColors() {
  let hue = random(0, 360);
  colorMode(HSB);
  playerColor = color(hue, 100, 100);
  playerColorDim = color(hue, 100, 75);
  colorMode(RGB);
}

function setupUI() {
  // Create buttons
  let jX, jY, jW, jH, bX, bY, bW, bH;
  
  if (width < height) {
    jX = 0.05*width;
    jY = 0.05*height;
    jW = 0.9*width;
    jH = 0.9*width;
    
    bX = 0.05*windowWidth;
    bY = 0.75*windowHeight;
    bW = 0.9*windowWidth;
    bH = 0.2*windowHeight;
  }
  else {
    jX = 0.05*width;
    jY = 0.05*height;
    jW = 0.9*height;
    jH = 0.9*height;
    
    bX = 0.75*windowWidth;
    bY = 0.05*windowHeight;
    bW = 0.2*windowWidth;
    bH = 0.9*windowHeight;
  }
  
  joystick = createJoystick("Joystick", jX, jY, jW, jH);
  joystick.setStyle({
    handleRadius:     joystick.w*0.2, 
    fillBg:           color(0), 
    fillBgHover:      color(0), 
    fillBgActive:     color(0), 
    strokeBg:         playerColor, 
    strokeBgHover:    playerColor, 
    strokeBgActive:   playerColor, 
    fillHandle:       playerColorDim, 
    fillHandleHover:  playerColorDim, 
    fillHandleActive: playerColor,
    strokeHandleHover:  color(255),
    strokeHandleActive: color(255)
  });
  joystick.onChange = onJoystickChange;
  
  button = createButton("Interact", bX, bY, bW, bH);
  button.setStyle({
    textSize: 40,
    fillBg: playerColorDim,
    fillBgHover: playerColorDim,
    fillBgActive: playerColor
  });
  button.onChange = onButtonChange;
}

////////////
// Input processing
function onJoystickChange() {  
  thisJ.x = floor(joystick.val.x*divs)/divs;
  thisJ.y = floor(joystick.val.y*divs)/divs;
  
  if (thisJ.x != prevJ.x || thisJ.y != prevJ.y) {
    let data = {
      joystickX: thisJ.x,
      joystickY: thisJ.y
    }
    sendData(data);
  }
  
  prevJ.x = thisJ.x;
  prevJ.y = thisJ.y;
}

function onButtonChange() {
  let data = {
    button: button.val
  }
  
  sendData(data);
}

////////////
// Send data to server
function sendData(data) {
  // print rotation data to console
  console.log('Sending: ' + data);

  data.roomId = roomId;
  
  // Send rotation data to server
  socket.emit('sendData', data);
}

////////////////////////////////////////
////////////////////////////////////////

/// Add these lines below sketch to prevent scrolling on mobile
function touchMoved() {
  // do some stuff
  return false;
}