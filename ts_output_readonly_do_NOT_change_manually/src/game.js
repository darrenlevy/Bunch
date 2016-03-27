;
var game;
(function (game) {
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console:
    // game.state
    game.animationEnded = false;
    game.canMakeMove = false;
    game.isComputerTurn = false;
    game.move = null; //prior move
    game.state = null;
    game.isHelpModalShown = false;
    game.cards = [];
    game.cardsPlayed = [];
    game.seconds = 0;
    game.player1Score = 0;
    game.player2Score = 0;
    game.deckIndex = 0;
    game.resultRound = 1;
    game.roundStarted = false;
    var timer;
    game.showResults = false;
    function init() {
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        log.log("Translation of 'RULES_OF_BUNCHES' is " + translate('RULES_OF_BUNCHES'));
        resizeGameAreaService.setWidthToHeight(3 / 2);
        moveService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            checkMoveOk: gameLogic.checkMoveOk,
            updateUI: updateUI
        });
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        document.addEventListener("animationend", animationEndedCallback, false); // standard
        document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
        document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
        var w = window;
        if (w["HTMLInspector"]) {
            setInterval(function () {
                w["HTMLInspector"].inspect({
                    excludeRules: ["unused-classes", "script-placement"],
                });
            }, 3000);
        }
    }
    game.init = init;
    function getTranslations() {
        return {
            RULES_OF_BUNCHES: {
                en: "Rules of Bunches",
                es: "Reglas de Los Manojos",
            },
            RULES_SLIDE1: {
                en: "You and your opponent take turns finding a Bunch. A Bunch is 3 cards where the number of emoji, color of emoji, the emoji itself and border of the card are all the same or all different.",
                es: "Usted y su oponente se da vuelta para encontrar un manojo. Un manojo es 3 cartas donde el número de emoji, el color de emoji, el propio emoji y el borde de la tarjeta son todos iguales o diferentes.",
            },
            RULES_SLIDE2: {
                en: "There are 2 rounds. Player 1 starts the first round. Player 2 starts the second round. You receive 1 point for similarities and 3 points for differences.",
                es: "Hay 2 rondas. El jugador 1 comienza la primera ronda. El jugador 2 se inicia la segunda ronda. Recibe 1 punto por similitudes y 3 puntos por diferencias.",
            },
            CLOSE: {
                en: "Close",
                es: "Cerca",
            },
        };
    }
    function animationEndedCallback() {
        $rootScope.$apply(function () {
            log.info("Animation ended");
            game.animationEnded = true;
            //sendComputerMove();
        });
    }
    function sendComputerMove() {
        if (!game.isComputerTurn) {
            return;
        }
        game.isComputerTurn = false; // to make sure the computer can only move once.
        moveService.makeMove(aiService.findComputerMove(game.move));
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
            game.move.endMatchScores = [0, 0];
            game.move.turnIndexAfterMove = 0;
            game.move.stateAfterMove = game.state;
        }
        resetBoard(game.state.scores);
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        game.deckIndex = game.canMakeMove ? game.state.round - 1 : game.deckIndex;
        if (game.move.turnIndexAfterMove < 0) {
            $interval.cancel(timer);
        }
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            //if (!state.bunches) {
            sendComputerMove();
        }
    }
    function gameIsOver() {
        return game.move.turnIndexAfterMove < 0;
    }
    game.gameIsOver = gameIsOver;
    function isWinner(playerIndex) {
        if (!gameIsOver()) {
            return false;
        }
        if (playerIndex == 0) {
            return game.player1Score == game.player2Score;
        }
        if (playerIndex == 1) {
            return game.player1Score > game.player2Score;
        }
        if (playerIndex == 2) {
            return game.player1Score < game.player2Score;
        }
        return false;
    }
    game.isWinner = isWinner;
    function cardClicked(cardIndex) {
        if (game.state && game.state.bunches.length % 2 == 1) {
            var lastBunchIndex = game.state.bunches.length - 1;
            var lastBunch = game.state.bunches[lastBunchIndex];
            if (lastBunch.seconds <= game.seconds && lastBunch.cardIndices.indexOf(cardIndex) !== -1) {
                return;
            }
        }
        var index = game.cards.indexOf(cardIndex);
        if (index == -1) {
            game.cards.push(cardIndex);
        }
        else {
            game.cards.splice(index, 1);
        }
        if (game.cards.length >= 3) {
            game.cardsPlayed = game.cards;
            submitMove();
        }
        else {
            game.cardsPlayed = [];
        }
    }
    game.cardClicked = cardClicked;
    function isCurrentPlayerIndex(playerIndex) {
        return game.move.turnIndexAfterMove == playerIndex;
    }
    game.isCurrentPlayerIndex = isCurrentPlayerIndex;
    function startClicked() {
        if (gameIsOver() || !game.canMakeMove) {
            return;
        }
        game.roundStarted = true;
        game.cardsPlayed = [];
        timer = $interval(function () {
            game.seconds++;
        }, 1000);
    }
    game.startClicked = startClicked;
    function resetBoard(scores) {
        $interval.cancel(timer);
        game.roundStarted = false;
        game.cards = [];
        game.seconds = 0;
        game.player1Score = scores[0];
        game.player2Score = scores[1];
    }
    function passMove() {
        if (game.canMakeMove) {
            game.cards = [];
            submitMove();
        }
    }
    game.passMove = passMove;
    function submitMove() {
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!game.canMakeMove) {
            return;
        }
        try {
            var nextMove = gameLogic.createMove(game.state, game.cards, game.seconds, game.move.turnIndexAfterMove, game.state.round, game.state.scores);
            game.canMakeMove = false; // to prevent making another move
            moveService.makeMove(nextMove);
        }
        catch (e) {
            log.info(["Invalid cards:", game.cards]);
            game.cards = [];
            return;
        }
    }
    game.submitMove = submitMove;
    function getEmoji(index) {
        var emoji = "";
        var count = parseInt(game.state.decks[game.deckIndex][index][1]);
        for (var i = 0; i < count; i++) {
            emoji += game.state.decks[game.deckIndex][index][0] + " ";
        }
        return emoji;
    }
    game.getEmoji = getEmoji;
    function isGreen(index) {
        return game.state.decks[game.deckIndex][index][2] == "green";
    }
    game.isGreen = isGreen;
    function isPink(index) {
        return game.state.decks[game.deckIndex][index][2] == "pink";
    }
    game.isPink = isPink;
    function isOrange(index) {
        return game.state.decks[game.deckIndex][index][2] == "orange";
    }
    game.isOrange = isOrange;
    function isSolid(index) {
        return game.state.decks[game.deckIndex][index][3] == "solid";
    }
    game.isSolid = isSolid;
    function isDotted(index) {
        return game.state.decks[game.deckIndex][index][3] == "dotted";
    }
    game.isDotted = isDotted;
    function isDouble(index) {
        return game.state.decks[game.deckIndex][index][3] == "double";
    }
    game.isDouble = isDouble;
    function shouldFlip(index) {
        if (game.state && game.state.bunches.length % 2 == 1) {
            var lastBunchIndex = game.state.bunches.length - 1;
            var lastBunch = game.state.bunches[lastBunchIndex];
            if (lastBunch.seconds <= game.seconds && lastBunch.cardIndices.indexOf(index) !== -1) {
                if (game.cards.indexOf(index) !== -1) {
                    game.cards.splice(game.cards.indexOf(index), 1);
                }
                return true;
            }
        }
        return false;
    }
    game.shouldFlip = shouldFlip;
    function shouldHintCardIndex(index) {
        if (gameIsOver()) {
            return false;
        }
        if (game.seconds < 20) {
            return false;
        }
        var deck = game.state.decks[game.state.round - 1];
        var possibleMoves = aiService.getPossibleMoves(game.state, game.move.turnIndexAfterMove);
        var validMoveExists = false;
        for (var i = 0; i < possibleMoves.length; i++) {
            var possibleMove = possibleMoves[i];
            var bunches = possibleMove.stateAfterMove.bunches;
            var lastBunch = bunches[bunches.length - 1];
            var alreadyPlayed = false;
            for (var y = 0; y < lastBunch.cardIndices.length; y++) {
                alreadyPlayed = shouldFlip(lastBunch.cardIndices[y]);
                if (alreadyPlayed) {
                    break;
                }
            }
            if (alreadyPlayed) {
                continue;
            }
            validMoveExists = true;
            if (game.seconds == 20) {
                return lastBunch.cardIndices[0] == index;
            }
            else if (game.seconds == 30) {
                return lastBunch.cardIndices[1] == index;
            }
        }
        return -1 == index && game.seconds > 30 && !validMoveExists;
    }
    game.shouldHintCardIndex = shouldHintCardIndex;
    function shouldShakeCard(index) {
        if (game.cardsPlayed.indexOf(index) !== -1) {
            var borders = [];
            for (var i = 0; i < 3; i++) {
                var cardPlayed = game.cardsPlayed[i];
                var border = game.state.decks[game.state.round - 1][cardPlayed][3];
                if (borders.indexOf(border) === -1) {
                    borders.push(border);
                }
            }
            return borders.length !== 1 && borders.length !== 3;
        }
        return false;
    }
    game.shouldShakeCard = shouldShakeCard;
    function shouldBounceEmoji(index) {
        if (game.cardsPlayed.indexOf(index) !== -1) {
            var emojis = [];
            var counts = [];
            var colors = [];
            for (var i = 0; i < 3; i++) {
                var cardPlayed = game.cardsPlayed[i];
                var emoji = game.state.decks[game.state.round - 1][cardPlayed][0];
                var count = game.state.decks[game.state.round - 1][cardPlayed][1];
                var color = game.state.decks[game.state.round - 1][cardPlayed][2];
                if (emojis.indexOf(emoji) === -1) {
                    emojis.push(emoji);
                }
                if (counts.indexOf(count) === -1) {
                    counts.push(count);
                }
                if (colors.indexOf(color) === -1) {
                    colors.push(color);
                }
            }
            return (emojis.length !== 1 && emojis.length !== 3) ||
                (counts.length !== 1 && counts.length !== 3) ||
                (colors.length !== 1 && colors.length !== 3);
        }
        return false;
    }
    game.shouldBounceEmoji = shouldBounceEmoji;
    function resultRoundClicked(round) {
        if (game.resultRound == round) {
            game.showResults = !game.showResults;
        }
        game.resultRound = round;
    }
    game.resultRoundClicked = resultRoundClicked;
    function resultIsGreen(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][2] == "green";
    }
    game.resultIsGreen = resultIsGreen;
    function resultIsPink(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][2] == "pink";
    }
    game.resultIsPink = resultIsPink;
    function resultIsOrange(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][2] == "orange";
    }
    game.resultIsOrange = resultIsOrange;
    function resultIsSolid(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][3] == "solid";
    }
    game.resultIsSolid = resultIsSolid;
    function resultIsDotted(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][3] == "dotted";
    }
    game.resultIsDotted = resultIsDotted;
    function resultIsDouble(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][3] == "double";
    }
    game.resultIsDouble = resultIsDouble;
    function getResultEmoji(playerIndex, cardIndex) {
        var emoji = "";
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return "";
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return "";
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        var count = parseInt(game.state.decks[roundIndex][index][1]);
        for (var i = 0; i < count; i++) {
            emoji += game.state.decks[roundIndex][index][0];
        }
        return emoji;
    }
    game.getResultEmoji = getResultEmoji;
    //   export function shouldShowImage(row: number, col: number): boolean {
    //     let cell = state.board[row][col];
    //     return cell !== "";
    //   }
    //   export function isPieceX(row: number, col: number): boolean {
    //     return state.board[row][col] === 'X';
    //   }
    //   export function isPieceO(row: number, col: number): boolean {
    //     return state.board[row][col] === 'O';
    //   }
    //   export function shouldSlowlyAppear(row: number, col: number): boolean {
    //     return !animationEnded &&
    //         state.delta &&
    //         state.delta.row === row && state.delta.col === col;
    //   }
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map