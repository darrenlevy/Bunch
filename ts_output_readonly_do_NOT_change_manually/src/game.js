;
var game;
(function (game) {
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console:
    // game.state
    game.animationEnded = false;
    game.canMakeMove = false;
    game.isComputerTurn = false;
    game.move = null;
    game.state = null;
    game.isHelpModalShown = false;
    game.cards = [];
    game.seconds = 0;
    game.player1Score = 0;
    game.player2Score = 0;
    game.deckIndex = 0;
    var timer;
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
                en: "You and your opponent take turns finding a Bunch. A Bunch is 2 or 3 cards where the number of emoji, color of emoji, the emoji itself and border of the card are all the same or all different.",
                es: "Usted y su oponente se da vuelta para encontrar un manojo. Un manojo es 2 o 3 cartas donde el número de emoji, el color de emoji, el propio emoji y el borde de la tarjeta son todos iguales o diferentes.",
            },
            RULES_SLIDE2: {
                en: "The first player goes, then the second player goes with the same cards for each round. After 3 rounds, the player with the most points wins.",
                es: "El primer jugador pasa, entonces el segundo jugador va con las mismas cartas para cada ronda. Después de 3 rondas, el jugador con más puntos gana.",
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
            sendComputerMove();
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
        }
        resetBoard(game.state.scores);
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        game.deckIndex = game.canMakeMove ? game.state.round - 1 : game.deckIndex;
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            // We calculate the AI move only after the animation finishes,
            // because if we call aiService now
            // then the animation will be paused until the javascript finishes.
            if (!game.state.bunches) {
                // This is the first move in the match, so
                // there is not going to be an animation, so
                // call sendComputerMove() now (can happen in ?onlyAIs mode)
                sendComputerMove();
            }
        }
    }
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
    }
    game.cardClicked = cardClicked;
    function isCurrentPlayerIndex(playerIndex) {
        return game.move.turnIndexAfterMove == playerIndex;
    }
    game.isCurrentPlayerIndex = isCurrentPlayerIndex;
    function resetBoard(scores) {
        $interval.cancel(timer);
        game.cards = [];
        game.seconds = 0;
        game.player1Score = scores[0];
        game.player2Score = scores[1];
        timer = $interval(function () {
            game.seconds++;
            if (game.seconds > 99) {
                $interval.cancel(timer);
            }
        }, 1000);
    }
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
            return;
        }
    }
    game.submitMove = submitMove;
    function getEmoji(index) {
        var emoji = "";
        var count = parseInt(game.state.decks[game.deckIndex][index][1]);
        for (var i = 0; i < count; i++) {
            emoji += game.state.decks[game.deckIndex][index][0];
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