'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GLUE = 'GLUE'
const GAMER = 'GAMER'

const GAMER_IMG = '<img src="img/gamer.png">'
const GLUED_GAMER_IMG = '<img src="img/gamer-purple.png">'
const BALL_IMG = '<img src="img/ball.png">'
const GLUE_IMG = '<img src="img/candy.png">'

const ADD_BALL_FREQ = 4000
const ADD_GLUE_FREQ = 5000
const REMOVE_GLUE_FREQ = 3000

// Model:
var gBoard
var gGamerPos
var gBallsCollected
var gCreatedBalls
var ballsAddedInterval = 0
var gIsGameOn
var gBallInterval
var gIsGamerGlued
var gGlueInterval




function onInitGame() {
    showGame()
    gGamerPos = { i: 2, j: 9 }
    gIsGameOn = true
    gIsGamerGlued = false
    gBallsCollected = 0
    gCreatedBalls = 0
    gBoard = buildBoard()
    renderBoard(gBoard)
    gBallInterval = setInterval(addBall, ADD_BALL_FREQ)
    gGlueInterval = setInterval(addGlue, ADD_GLUE_FREQ)
    updateBallsCollected()
    showBallsElement()
}


function buildBoard() {
    // DONE: Create the Matrix 10 * 12 
    // DONE: Put FLOOR everywhere and WALL at edges
    // DONE: Place the gamer and two balls
    const board = []
    const rowsCount = 11
    const colsCount = 13
    for (var i = 0; i < rowsCount; i++) {
        board[i] = []
        for (var j = 0; j < colsCount; j++) {
            board[i][j] = { type: FLOOR, gameElement: null }
            if (i === 0 || i === rowsCount - 1 ||
                j === 0 || j === colsCount - 1) {
                board[i][j].type = WALL
            }
            if (j === 6 && i === 0 ||
                j === 6 && i === rowsCount - 1 ||
                i === 5 && j === 0 ||
                i === 5 && j === colsCount - 1) {
                board[i][j].type = FLOOR
            }
        }
    }
    board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
    return board
}


//* Render the board to an HTML table
function renderBoard(board) {

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            var cellClass = getClassName({ i: i, j: j }) // cell-i-j floor

            if (currCell.type === FLOOR) cellClass += ' floor'
            else if (currCell.type === WALL) cellClass += ' wall'

            strHTML += `<td class="cell ${cellClass}" onclick="moveTo(${i}, ${j})" >`

            if (currCell.gameElement === GAMER) {
                strHTML += GAMER_IMG
            } else if (currCell.gameElement === BALL) {
                strHTML += BALL_IMG
            }

            strHTML += '</td>'
        }
        strHTML += '</tr>'
    }
    // console.log(strHTML)
    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}



//* Move the player to a specific location
function moveTo(i, j) {
    if (!gIsGameOn) return
    if (gIsGamerGlued) return

    if (i < 0) i = gBoard.length - 1
    if (i >= gBoard.length) i = 0
    if (j < 0) j = gBoard[0].length - 1
    if (j >= gBoard[0].length) j = 0

    
    //* Calculate distance to make sure we are moving to a neighbor cell
    const iAbsDiff = Math.abs(i - gGamerPos.i)
    const jAbsDiff = Math.abs(j - gGamerPos.j)
    
    //* If the clicked Cell is one of the four allowed
    if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0) ||
    (iAbsDiff === gBoard.length - 1) || (jAbsDiff === gBoard[0].length - 1)) {

        const targetCell = gBoard[i][j]
        if (targetCell.type === WALL) return

        if (targetCell.gameElement === BALL) handleEatingBall()
        else if (targetCell.gameElement === GLUE) handleGlue()

        gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
        renderCell(gGamerPos, '')

        gBoard[i][j].gameElement = GAMER
        gGamerPos = { i, j }

        renderCell(gGamerPos, GAMER_IMG)

        updateBallsNeighbor()

        const gamerImg = gIsGamerGlued ? GLUED_GAMER_IMG : GAMER_IMG
        renderCell(gGamerPos, gamerImg)

    }
}

function handleEatingBall() {
playSound()
gBallsCollected++
updateBallsCollected()
if (gBallsCollected !== 0 && isVictory()) {
    setTimeout(showWin, 400)
}
}

function addBall() {
    const emptyPos = getEmptyPos()
    if (!emptyPos) return

    gBoard[emptyPos.i][emptyPos.j].gameElement = BALL
    renderCell(emptyPos, BALL_IMG)
    gCreatedBalls++
    updateBallsNeighbor()
}


function updateBallsCollected() {
    const elBallCollected = document.querySelector('.balls-collected')
    elBallCollected.innerText = `Balls Collected: ${gBallsCollected}`
}


function addGlue() {
    const emptyPos = getEmptyPos()
    if (!emptyPos) return
    //MODEL
    gBoard[emptyPos.i][emptyPos.j].gameElement = GLUE
    //DOM
    renderCell(emptyPos, GLUE_IMG)
    setTimeout(() => removeGlue(emptyPos), REMOVE_GLUE_FREQ)
}

function removeGlue(gluePos) {
    const cell = gBoard[gluePos.i][gluePos.j]
    if (cell.gameElement !== GLUE) return
    gBoard[gluePos.i][gluePos.j].gameElement = null;
    renderCell(gluePos, '');
}

function handleGlue() {
    gIsGamerGlued = true
    setTimeout(() => {
        gIsGamerGlued = false
        renderCell(gGamerPos, GAMER_IMG)
    }, REMOVE_GLUE_FREQ)
}


function getEmptyPos() {
    const emptyPoss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]
            if (currCell.type !== WALL && !currCell.gameElement) {
                emptyPoss.push({ i, j })
            }
        }
    }

    const randIdx = getRandomInt(0, emptyPoss.length)
    return emptyPoss[randIdx]
}




function countBallsNeighbor() {
    var count = 0
    const directions = [
        { i: -1, j: 0 },
        { i: 1, j: 0 },
        { i: 0, j: -1 },
        { i: 0, j: 1 }
    ]
    for (let element of directions) {
        const currI = gGamerPos.i + element.i
        const currJ = gGamerPos.j + element.j
        if (currI >= 0 && currI < gBoard.length && currJ >= 0 && currJ < gBoard[0].length) {

            if (gBoard[currI][currJ].gameElement === BALL) {
                count++
            }
        }
    }
    return count
}

function updateBallsNeighbor() {
    var ballCount = countBallsNeighbor()
    const elBallsNeighbor = document.querySelector('.balls-neighbor span')
    elBallsNeighbor.innerText = ballCount
}




function playSound() {
    const sound = new Audio('sound/eating-ball.mp3')
    sound.play()
}



function isVictory() {
    if (gBallsCollected === gCreatedBalls) {
        return true
    }
    return false
}

function gameOver() {
    gIsGameOn = false
    clearInterval(gBallInterval)
    clearInterval(gGlueInterval)
    showWin()
}

function showWin() {
    showElement('.you-won')
    hideElement('.game')
}

function showGame() {
    showElement('.game')
    hideElement('.you-won')
}

function showBallsElement() {
    showElement('.balls-collected')
    showElement('.balls-neighbor')
}

function showElement(selector) {
    const element = document.querySelector(selector)
    element.classList.remove('hide')
}

function hideElement(selector) {
    const element = document.querySelector(selector)
    element.classList.add('hide')
}




//* Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
    const cellSelector = '.' + getClassName(location)
    const elCell = document.querySelector(cellSelector)
    elCell.innerHTML = value
}


//* Returns the class name for a specific cell
function getClassName(location) {
    const cellClass = `cell-${location.i}-${location.j}`
    return cellClass
}

//* Move the player by keyboard arrows
function onKey(ev) {
    const i = gGamerPos.i
    const j = gGamerPos.j
    // console.log('ev.code:', ev.code)
    switch (ev.code) {
        case 'ArrowLeft':
            moveTo(i, j - 1)
            break
        case 'ArrowRight':
            moveTo(i, j + 1)
            break
        case 'ArrowUp':
            moveTo(i - 1, j)
            break
        case 'ArrowDown':
            moveTo(i + 1, j)
            break
    }
}

