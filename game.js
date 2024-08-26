const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

let selectedColor = 'white';

const isHost = !window.opener;

let playerWindow = isHost ? null : window.opener;

const paddleWidth = 10;
const paddleHeight = 100;
let player1Y = (canvas.height - paddleHeight) / 2;
let player2Y = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 2;
let ballSpeedY = 1;
let player1Score = 0;
let player2Score = 0;
const winningScore = 5;

let player1UpPressed = false;
let player1DownPressed = false;
let player2UpPressed = false;
let player2DownPressed = false;

let timerActive = false;
let timerCount = 3;
let timerInterval = null;


document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'w': player1UpPressed = true; break;
        case 's': player1DownPressed = true; break;
        case 'ArrowUp': player2UpPressed = true; break;
        case 'ArrowDown': player2DownPressed = true; break;
    }
});

document.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': player1UpPressed = false; break;
        case 's': player1DownPressed = false; break;
        case 'ArrowUp': player2UpPressed = false; break;
        case 'ArrowDown': player2DownPressed = false; break;
    }
});

function openPlayerWindow() {
    if (isHost) {
        playerWindow = window.open('player2.html', 'Player2', 'width=800,height=400');
    }
}

function startTimer() {
    if (timerActive) return;
    timerActive = true;
    timerCount = 3;
    updateTimerDisplay(timerCount);
    timerInterval = setInterval(() => {
        timerCount--;
        if (timerCount > 0) {
            updateTimerDisplay(timerCount);
        } else {
            clearInterval(timerInterval);
            timerActive = false;
            updateTimerDisplay('');
            if (isHost) {
                ballSpeedX = (Math.random() > 0.5 ? 2 : -2);
                ballSpeedY = (Math.random() * 2 - 1); 
            }
        }
    }, 1000);
}

function updateTimerDisplay(count) {
    if (count > 0) {
        context.font = '50px Arial';
        context.fillStyle = 'white';
        context.fillText(count, canvas.width / 2 - 15, canvas.height / 2 + 15);
    }
}

function gameLoop() {
    if (!timerActive) {
        if (isHost) {
            moveBall();
            sendBallPosition(ballX, ballY);
        }
    }
    movePaddles();
    drawEverything();
    requestAnimationFrame(gameLoop);
}

function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= 0 || ballY >= canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    if (ballX <= paddleWidth) {
        if (ballY >= player1Y && ballY <= player1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else {
            player2Score++;
            sendScoreUpdate();
            if (checkGameOver()) return;
            resetBall();
        }
    }

    if (ballX >= canvas.width - paddleWidth) {
        if (ballY >= player2Y && ballY <= player2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else {
            player1Score++;
            sendScoreUpdate();
            if (checkGameOver()) return;
            resetBall();
        }
    }
}

function movePaddles() {
    if (isHost) {
        if (player1UpPressed && player1Y > 0) {
            player1Y -= 5;
            sendPaddlePosition(1, player1Y);
        }
        if (player1DownPressed && player1Y < canvas.height - paddleHeight) {
            player1Y += 5;
            sendPaddlePosition(1, player1Y);
        }
    } else {
        if (player2UpPressed && player2Y > 0) {
            player2Y -= 5;
            sendPaddlePosition(2, player2Y);
        }
        if (player2DownPressed && player2Y < canvas.height - paddleHeight) {
            player2Y += 5;
            sendPaddlePosition(2, player2Y);
        }
    }
}

function drawEverything() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.fillRect(0, player1Y, paddleWidth, paddleHeight);
    context.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight);

    if (!timerActive) {
        context.beginPath();
        context.arc(ballX, ballY, 10, 0, Math.PI * 2);
        context.fill();
    }

    if (timerActive) {
        updateTimerDisplay(timerCount);
    }

    document.getElementById('player1-score').textContent = `Player 1: ${player1Score}`;
    document.getElementById('player2-score').textContent = `Player 2: ${player2Score}`;
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 0;
    ballSpeedY = 0;
    startTimer();
    if (playerWindow) {
        playerWindow.postMessage({ type: 'startTimer' }, '*');
    }
}

function checkGameOver() {
    if (player1Score >= winningScore) {
        alert("Player 1 wins!");
        resetGame();
        return true;
    } else if (player2Score >= winningScore) {
        alert("Player 2 wins!");
        resetGame();
        return true;
    }
    return false;
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    resetBall();
    sendScoreUpdate();
}

function sendPaddlePosition(player, y) {
    if (isHost && playerWindow) {
        playerWindow.postMessage({ type: 'paddleMove', player: player, y: y }, '*');
    } else if (!isHost && playerWindow) {
        window.opener.postMessage({ type: 'paddleMove', player: player, y: y }, '*');
    }
}

function sendBallPosition(x, y) {
    if (isHost && playerWindow) {
        playerWindow.postMessage({ type: 'ballUpdate', x: x, y: y }, '*');
    }
}

function sendScoreUpdate() {
    if (isHost && playerWindow) {
        playerWindow.postMessage({ type: 'scoreUpdate', player1Score: player1Score, player2Score: player2Score }, '*');
    }
}

window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || typeof data.type === 'undefined') return;

    switch(data.type) {
        case 'paddleMove':
            if (data.player === 1) {
                player1Y = data.y;
            } else if (data.player === 2) {
                player2Y = data.y;
            }
            break;
        case 'ballUpdate':
            if (!timerActive && !isHost) {
                ballX = data.x;
                ballY = data.y;
            }
            break;
        case 'scoreUpdate':
            if (!isHost) {
                player1Score = data.player1Score;
                player2Score = data.player2Score;
            }
            break;
        case 'startTimer':
            startTimer();
            break;
        default:
            break;
    }
});

if (isHost) {
    window.addEventListener('beforeunload', function() {
        if (playerWindow && !playerWindow.closed) {
            playerWindow.close();
        }
    });
}

function openPlayerWindow() {
    if (isHost) {
        playerWindow = window.open('player2.html', 'Player2', 'width=800,height=400');
    }
}

document.getElementById('start-button')?.addEventListener('click', function() {
    if (isHost) {
        openPlayerWindow();
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        gameLoop();
    }
});

if (!isHost) {
    document.getElementById('start-menu')?.remove();
    document.getElementById('game-container').style.display = 'flex';
    gameLoop();
}
