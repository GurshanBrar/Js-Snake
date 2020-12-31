// In this script we add our snake's functionality
'use strict';

// We can start by defining some elements in our page
let snakeContainer = document.getElementById('snake-container');
let snakeCanvas = document.getElementById('snake-canvas');

let playButton = document.getElementsByClassName('play-button')[0];

let scoreDisplay = document.getElementById('score');
let lengthDisplay = document.getElementById('length');

// Set the html width and height of our canvas to the snakecontainer's width minus its padding, and the height to a ratio of 5:2 which means the width will be 2.5 times bigger than the height

snakeCanvas.width = snakeContainer.offsetWidth - 60;
snakeCanvas.height = snakeCanvas.width / 2.5;

// NOTE: when choosing a block on the screen subtract 1

const blocksX = 40;
const blocksY = 16;
const pixelsPerBlock = snakeCanvas.height / blocksY;

// Divide the blocks by two, round it up to take care of odd numbers, and subtract 1 since coordinates start at zero for block number 1

let centerX = (Math.ceil(blocksX / 2) - 1) * pixelsPerBlock;
let centerY = (Math.ceil(blocksY / 2) - 1) * pixelsPerBlock;

// The time in miliseconds our game loop will take to repeat
const interval = 80;

// An object to handle events
const eventKeysToDirection = {
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
    ArrowRight: 'right',
    ArrowLeft: 'left',
    ArrowDown: 'down',
    ArrowUp: 'up',
};

const oppositeDirections = {
    right: 'left',
    left: 'right',
    up: 'down',
    down: 'up',
};
const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
// loop variable
let repeat;

// Game variables. These have to be defined to render the game on page load
let gameStart = false;
let score = 0;
let length = 1;

// This is an object of objects representing the snake's coordinates. H means head, B means body and F means food
let snakeCoords = {
    H: { x: centerX, y: centerY },
    B: [],
    F: {},

    getBodyWithoutZeroes() {
        let arr = this.B.filter(item => {
            return item !== 0;
        });
        return arr;
    },
};

// These can be defined later on
let gameOver;
let oppositeDirection;
let moveDirection;

let playFoodSound = false;
let foodSound = new Sound('https://cloud-8ofpe6u8q.vercel.app/0chomp.wav');
let crashSound = new Sound('https://cloud-g29qdppmb.vercel.app/0bump.wav');

// Now we render the screen for the first time manually
render();

// Start the event listeners. Keydown means that any key is pressed down
document.addEventListener('keydown', event => {
    if (gameStart === false) {
        return;
    }
    // prevent scrolling from happening
    event.preventDefault();
    // check for events and change variable accordingly
    // also, make sure our snake can move in that direction
    let direction = eventKeysToDirection[event.key] || moveDirection;
    // check if our snake is able to move in that direction meaning
    moveDirection = direction === oppositeDirection ? moveDirection : direction;
});

// The event listener for the play button. It starts our game loop, makes the button dissappear, the score reappear, and resets game variables to default to restart the game
playButton.addEventListener('click', () => {
    repeat = window.setInterval(main, interval);

    resetVars();

    playButton.style.visibility = 'hidden';
    scoreDisplay.style.visibility = 'visible';
    lengthDisplay.style.visibility = 'visible';
});

// All of our functions are down here

// This function resets game variables allowing for a fresh start
function resetVars() {
    gameStart = true;
    gameOver = false;
    oppositeDirection = null;
    moveDirection = null;
    score = 0;
    length = 1;

    snakeCoords.H = { x: centerX, y: centerY };
    snakeCoords.B = [];
    // here we assign a random food position making sure its not where the snake starts

    // A do while loop means the function code will execute more than 1 time if the while condition is satisified
    do {
        // Get random x and y coordinates using the rand module. It gives a number from 0 to 1 so we can multiply it by our block count to add it in the correct range
        snakeCoords.F = {
            x: Math.floor(Math.random() * blocksX) * pixelsPerBlock,
            y: Math.floor(Math.random() * blocksY) * pixelsPerBlock,
        };
    } while (snakeCoords.F.x === centerX && snakeCoords.F.y === centerY);
}

// Our main function. It repeats every [interval] seconds and controls everthing
function main() {
    if (gameStart === false) {
        return;
    }
    // step 1 - emulate snake movement //
    moveSnake();

    // step 2 - here's where we start adding in our conditionals
    checkBounds();
    gameOver = checkPassThrough(snakeCoords.H);
    checkFood();
    // step 3 - render display
    render();

    // handle game over properly
    if (gameOver) {
        gameStart = false;

        // This stops our main loop
        clearInterval(repeat);

        // Changes visibilty of the play button to visible and score/length to hidden
        playButton.style.visibility = 'visible';
        scoreDisplay.style.visibility = 'hidden';
        lengthDisplay.style.visibility = 'hidden';
    }
}

// this function emulates the movement of the snake
function moveSnake() {
    // if move direction is null don't do anything
    if (moveDirection === null) {
        return;
    }

    // add the current head to the beginning of the body
    snakeCoords.B.unshift({ x: snakeCoords.H.x, y: snakeCoords.H.y });
    // make the new head
    if (moveDirection === 'up') {
        snakeCoords.H.y -= pixelsPerBlock;
    } else if (moveDirection === 'down') {
        snakeCoords.H.y += pixelsPerBlock;
    } else if (moveDirection === 'right') {
        snakeCoords.H.x += pixelsPerBlock;
    } else {
        snakeCoords.H.x -= pixelsPerBlock;
    }
    // finally, remove the last element of the body
    snakeCoords.B.pop();

    // now we need to add the opposite direction
    if (snakeCoords.B.length > 0) {
        oppositeDirection = oppositeDirections[moveDirection];
    }
}

// This function makes sure the snake isn't out of bounds
function checkBounds() {
    if (
        snakeCoords.H.x < 0 ||
        snakeCoords.H.x > snakeCanvas.width - pixelsPerBlock ||
        snakeCoords.H.y < 0 ||
        snakeCoords.H.y > snakeCanvas.height - pixelsPerBlock
    ) {
        gameOver = true;
    }
}

// this function checks if the snake has collided with itself. It also helps the function check food
function checkPassThrough(obj) {
    if (!gameOver) {
        // the findindex function executes a function that is passed in from the user for every element in the array. We add a function and return a true or false value. if a true value is returned, findindex will return the index of the current element and -1 if nothing found.
        return (
            snakeCoords.B.findIndex(item => {
                return obj.x === item.x && obj.y === item.y;
            }) !== -1
        );
        // since we assign gameOver to this function we have to return the same value if the game is over
    } else {
        return gameOver;
    }
}

// this function checks if the snake has eaten some food, and also updates score and length variables since those are related
function checkFood() {
    if (
        snakeCoords.H.x === snakeCoords.F.x &&
        snakeCoords.H.y === snakeCoords.F.y &&
        !gameOver
    ) {
        playFoodSound = true;
        // make some new food

        // make sure the snake hasn't won because if it has our food function will not be able to place food anywhere
        if (snakeCoords.getBodyWithoutZeroes().length + 1 < blocksX * blocksY) {
            do {
                snakeCoords.F = {
                    x: Math.floor(Math.random() * blocksX) * pixelsPerBlock,
                    y: Math.floor(Math.random() * blocksY) * pixelsPerBlock,
                };
            } while (
                (snakeCoords.F.x === snakeCoords.H.x &&
                    snakeCoords.F.y === snakeCoords.H.y) ||
                checkPassThrough(snakeCoords.F)
            );
        } else {
            snakeCoords.F = {};
        }

        // add some dummy data
        for (let i = 0; i < 3; i++) {
            snakeCoords.B.push(0);
        }

        // update score
        score++;

        //update length
        length += 3;
    }
}

// This function draws the canvas based on the snake object, and changes the html of the score and length elements
function render() {
    if (!gameOver) {
        // Make canvas into snakeCanvas
        let canvas = snakeCanvas;

        // Make a context object from the canvas
        let ctx = canvas.getContext('2d');

        // Clear a rectangular area covering the whole screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set the line color to  black
        ctx.strokeStyle = 'black';

        // Draw head

        // Set the fill color to red
        ctx.fillStyle = 'brown';

        // Fill in a rectangle using coordinates from snakeCoords and pixelsPerBlock width and length
        ctx.fillRect(
            snakeCoords.H.x,
            snakeCoords.H.y,
            pixelsPerBlock,
            pixelsPerBlock,
        );

        // Draw body blocks by looping through body and accessing properties
        for (let obj of snakeCoords.getBodyWithoutZeroes()) {
            let index = Math.floor(Math.random() * colors.length);
            ctx.fillStyle = colors[index];
            ctx.fillRect(obj.x, obj.y, pixelsPerBlock, pixelsPerBlock);
        }

        // Draw food block
        let index = Math.floor(Math.random() * colors.length);
        ctx.fillStyle = colors[index];
        ctx.fillRect(
            snakeCoords.F.x,
            snakeCoords.F.y,
            pixelsPerBlock,
            pixelsPerBlock,
        );

        if (playFoodSound) {
            foodSound.play();
            playFoodSound = false;
        }
        // Change score
        scoreDisplay.innerHTML = `Score: ${score}`;

        // Change length
        lengthDisplay.innerHTML = `Length: ${length}`;
    } else {
        crashSound.play();
    }
}

// make our sound object constructor function
function Sound(src) {
    // makes an html audio element
    this.sound = document.createElement('audio');
    // adds the sound's file to its src
    this.sound.src = src;
    // sets attributes
    this.sound.setAttribute('preload', 'auto');
    this.sound.setAttribute('controls', 'none');
    this.sound.style.display = 'none';
    // adds it to the body
    document.body.appendChild(this.sound);
    // some functionality
    this.play = function () {
        this.sound.play();
    };

    this.stop = function () {
        foodSound.sound.pause();
    };
}
