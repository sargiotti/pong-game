const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

canvas.width = 300;
canvas.height = 600;

const paddleWidth = 100;
const paddleHeight = 10;
let player1X = (canvas.width - paddleWidth) / 2;
let player2X = (canvas.width - paddleWidth) / 2;
let player1Y = canvas.height - paddleHeight;
let player2Y = 0;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 0.5;
let ballSpeedY = 1;
let player1Score = 0;
let player2Score = 0;
const winningScore = 5;

let player1LeftPressed = false;
let player1RightPressed = false;
let player2LeftPressed = false;
let player2RightPressed = false;

let timerActive = false;
let timerCount = 3;
let timerInterval = null;

let ballImage = new Image();
ballImage.src = './logoOpenFortRed.png';

const isHost = true;
let playerWindow = null;

document.addEventListener('touchstart', function(event) {
    handleTouchStart(event);
}, false);

document.addEventListener('touchend', function(event) {
    handleTouchEnd(event);
}, false);

function handleTouchStart(event) {
    const touch = event.touches[0];
    const x = touch.clientX - canvas.getBoundingClientRect().left;
    const y = touch.clientY - canvas.getBoundingClientRect().top;

    if (y < canvas.height / 2) {
        player2LeftPressed = x < canvas.width / 2;
        player2RightPressed = x >= canvas.width / 2;
    } else {
        player1LeftPressed = x < canvas.width / 2;
        player1RightPressed = x >= canvas.width / 2;
    }
}

function handleTouchEnd(event) {
    player1LeftPressed = false;
    player1RightPressed = false;
    player2LeftPressed = false;
    player2RightPressed = false;
}

async function createAccount() {
    try {
        const response = await fetch('https://yummy-savory-board.glitch.me/createaccount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error('Error al crear la cuenta');
        }

        const data = await response.json();
        alert(`${data.message}`);
        return true;
    } catch (error) {
        alert('Hubo un problema al crear tu cuenta. Por favor, intenta nuevamente más tarde.');
        return false;
    }
}

async function startGame() {
    const accountCreated = await createAccount();
    console.log("empieza el juegeo")
    //if (accountCreated) {
        openPlayerWindow();
        gameLoop();
    //}
}

function openPlayerWindow() {
    if (isHost) {
        playerWindow = window.open('player2.html', 'Player2', 'width=400,height=800');
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
                ballSpeedY = (Math.random() > 0.25 ? 1 : -1);
                ballSpeedX = (Math.random() * 1 - 0.5);
            }
        }
    }, 1000);
}

function updateTimerDisplay(count) {
    if (count > 0) {
        context.font = '30px Arial';
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

    if (ballX <= 0 || ballX >= canvas.width) {
        ballSpeedX = -ballSpeedX;
    }

    if (ballY <= 0) {
        player2Score++;
        sendScoreUpdate();
        if (checkGameOver()) return;
        resetBall();
    }

    if (ballY >= canvas.height) {
        player1Score++;
        sendScoreUpdate();
        if (checkGameOver()) return;
        resetBall();
    }

    if (ballY >= player1Y && ballY <= player1Y + paddleHeight && ballX >= player1X && ballX <= player1X + paddleWidth) {
        ballSpeedY = -ballSpeedY;
    }

    if (ballY <= player2Y + paddleHeight && ballY >= player2Y && ballX >= player2X && ballX <= player2X + paddleWidth) {
        ballSpeedY = -ballSpeedY;
    }
}

function movePaddles() {
    if (isHost) {
        if (player1LeftPressed && player1X > 0) {
            player1X -= 5;
            sendPaddlePosition(1, player1X);
        }
        if (player1RightPressed && player1X < canvas.width - paddleWidth) {
            player1X += 5;
            sendPaddlePosition(1, player1X);
        }
    } else {
        if (player2LeftPressed && player2X > 0) {
            player2X -= 5;
            sendPaddlePosition(2, player2X);
        }
        if (player2RightPressed && player2X < canvas.width - paddleWidth) {
            player2X += 5;
            sendPaddlePosition(2, player2X);
        }
    }
}

function drawEverything() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.fillRect(player1X, player1Y, paddleWidth, paddleHeight);
    context.fillRect(player2X, player2Y, paddleWidth, paddleHeight);

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

  ballSpeedX = 0; // Movimiento lateral mínimo
  ballSpeedY = Math.random() > 0.5 ? 2 : -2;

  startTimer();
  if (playerWindow) {
    playerWindow.postMessage({ type: "startTimer" }, "*");
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

function sendPaddlePosition(player, x) {
    if (isHost && playerWindow) {
        playerWindow.postMessage({ type: 'paddleMove', player: player, x: x }, '*');
    } else if (!isHost && window.opener) {
        window.opener.postMessage({ type: 'paddleMove', player: player, x: x }, '*');
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
                player1X = data.x;
            } else if (data.player === 2) {
                player2X = data.x;
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

window.addEventListener('beforeunload', function() {
    if (playerWindow && !playerWindow.closed) {
        playerWindow.close();
    }
});

function openPlayerWindow() {
    if (isHost) {
        playerWindow = window.open('player2.html', 'Player2', 'width=400,height=800');
    }
}


startGame();
