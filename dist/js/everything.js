var gameLogic;
(function (gameLogic) {
    gameLogic.DECK_SIZE = 16;
    gameLogic.TOTAL_ROUNDS = 3;
    gameLogic.NUMBER_OF_PLAYERS = 2;
    gameLogic.NUMBER_OF_ELEMENTS_PER_CARD = 4;
    gameLogic.NUMBER_OF_TYPES = 3;
    /** Returns the initial deck, which is a list of cards. */
    function getInitialDecks() {
        return [makeDeck(), makeDeck(), makeDeck()];
    }
    function makeDeck() {
        var deck = [];
        for (var i = 0; i < gameLogic.DECK_SIZE; i++) {
            deck[i] = [getRandomSymbol(), getRandomCount(), getRandomColor(), getRandomBorder()];
        }
        return deck;
    }
    function getRandomSymbol() {
        var symbols = ["♡", "✌", "☺"];
        var index = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES);
        return symbols[index];
    }
    function getRandomCount() {
        var count = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES) + 1;
        return String(count);
    }
    function getRandomColor() {
        var colors = ["pink", "orange", "green"];
        var index = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES);
        return colors[index];
    }
    function getRandomBorder() {
        var borders = ["solid", "dotted", "double"];
        var index = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES);
        return borders[index];
    }
    function getInitialState() {
        return { decks: getInitialDecks(), bunches: [], round: 1, scores: [0, 0] };
    }
    gameLogic.getInitialState = getInitialState;
    /**
     * Returns true if the game is over.
     */
    function isGameOver(round) {
        return round > gameLogic.TOTAL_ROUNDS;
    }
    /**
     * Returns the winners.
     */
    function getWinner(scores) {
        if (scores[0] == scores[1]) {
            return [0, 0];
        }
        else if (scores[0] > scores[1]) {
            return [1, 0];
        }
        else {
            return [0, 1];
        }
    }
    /**
     * Returns true if cards represent valid move, false otherwise
     */
    function pointsForMove(cards, seconds) {
        var points = 0;
        if (cards.length === 0) {
            return 0;
        }
        for (var i = 0; i < gameLogic.NUMBER_OF_ELEMENTS_PER_CARD; i++) {
            var symbols = [];
            for (var z = 0; z < cards.length; z++) {
                var symbol = cards[z][i];
                if (symbols.indexOf(symbol) < 0) {
                    symbols.push(symbol);
                }
            }
            points += (110 - seconds) * symbols.length;
            if (symbols.length !== 1 && symbols.length !== gameLogic.NUMBER_OF_TYPES) {
                return -1;
            }
        }
        return points;
    }
    /**
     * Returns the move that should be performed when player
     * with index turnIndexBeforeMove makes a move.
     */
    function createMove(stateBeforeMove, cardIndices, seconds, turnIndexBeforeMove, round, scores) {
        if (isGameOver(round)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var deck = stateBeforeMove.decks[round - 1];
        var cards = [];
        for (var i = 0; i < cardIndices.length; i++) {
            cards.push(deck[cardIndices[i]]);
        }
        if (cards.length === 1) {
            throw new Error("One card is not a legal move!");
        }
        var points = pointsForMove(cards, seconds);
        if (points < 0) {
            throw new Error("That is not a legal move!");
        }
        var scoresAfterMove = angular.copy(scores);
        scoresAfterMove[turnIndexBeforeMove] += points;
        var bunches = angular.copy(stateBeforeMove.bunches);
        bunches.push({ cardIndices: cardIndices, seconds: seconds });
        var winner = null;
        var turnIndexAfterMove;
        var roundAfterMove = angular.copy(round);
        if (bunches.length % gameLogic.NUMBER_OF_PLAYERS === 1) {
            turnIndexAfterMove = 1 - turnIndexBeforeMove;
        }
        else {
            turnIndexAfterMove = turnIndexBeforeMove;
            roundAfterMove++;
        }
        if (isGameOver(roundAfterMove)) {
            // Game over.
            winner = getWinner(scoresAfterMove);
            turnIndexAfterMove = -1;
        }
        var stateAfterMove = { decks: stateBeforeMove.decks, bunches: bunches, round: roundAfterMove, scores: scoresAfterMove };
        return { endMatchScores: winner, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMove = createMove;
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        var move = stateTransition.move;
        var bunches = stateTransition.move.stateAfterMove.bunches;
        var bunch = bunches[bunches.length - 1];
        var cardIndices = bunch.cardIndices;
        var seconds = bunch.seconds;
        var round = stateBeforeMove ? stateBeforeMove.round : 1;
        var scores = stateBeforeMove ? stateBeforeMove.scores : [0, 0];
        var expectedMove = createMove(stateBeforeMove, cardIndices, seconds, turnIndexBeforeMove, round, scores);
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Move calculated=" + angular.toJson(expectedMove, true) +
                ", move expected=" + angular.toJson(move, true));
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map
;
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
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
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
        var index = game.cards.indexOf(cardIndex);
        if (index == -1) {
            game.cards.push(cardIndex);
        }
        else {
            game.cards.splice(index, 1);
        }
    }
    game.cardClicked = cardClicked;
    function cellClicked(cardIndicies, seconds, round, scores) {
        log.info("Clicked on cards:", cardIndicies);
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!game.canMakeMove) {
            return;
        }
        try {
            var nextMove = gameLogic.createMove(game.state, cardIndicies, seconds, game.move.turnIndexAfterMove, round, scores);
            game.canMakeMove = false; // to prevent making another move
            moveService.makeMove(nextMove);
        }
        catch (e) {
            log.info(["Invalid cards:", cardIndicies]);
            return;
        }
    }
    game.cellClicked = cellClicked;
    function getEmoji(index) {
        var emoji = "";
        var count = parseInt(game.state.decks[game.state.round - 1][index][1]);
        for (var i = 0; i < count; i++) {
            emoji += game.state.decks[game.state.round - 1][index][0];
        }
        return emoji;
    }
    game.getEmoji = getEmoji;
    function isGreen(index) {
        return game.state.decks[game.state.round - 1][index][2] == "green";
    }
    game.isGreen = isGreen;
    function isPink(index) {
        return game.state.decks[game.state.round - 1][index][2] == "pink";
    }
    game.isPink = isPink;
    function isOrange(index) {
        return game.state.decks[game.state.round - 1][index][2] == "orange";
    }
    game.isOrange = isOrange;
    function isSolid(index) {
        return game.state.decks[game.state.round - 1][index][3] == "solid";
    }
    game.isSolid = isSolid;
    function isDotted(index) {
        return game.state.decks[game.state.round - 1][index][3] == "dotted";
    }
    game.isDotted = isDotted;
    function isDouble(index) {
        return game.state.decks[game.state.round - 1][index][3] == "double";
    }
    game.isDouble = isDouble;
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
;
var aiService;
(function (aiService) {
    /** Returns the move that the computer player should do for the given state in move. */
    function findComputerMove(move) {
        return createComputerMove(move, 
        // at most 1 second for the AI to choose a move (but might be much quicker)
        { millisecondsLimit: 1000 });
    }
    aiService.findComputerMove = findComputerMove;
    /**
     * Returns all the possible moves for the given state and turnIndexBeforeMove.
     * Returns an empty array if the game is over.
     */
    //   export function getPossibleMoves(state: IState, turnIndexBeforeMove: number): IMove[] {
    //     let possibleMoves: IMove[] = [];
    //     for (let i = 0; i < gameLogic.ROWS; i++) {
    //       for (let j = 0; j < gameLogic.COLS; j++) {
    //         try {
    //           possibleMoves.push(gameLogic.createMove(state, i, j, turnIndexBeforeMove));
    //         } catch (e) {
    //           // The cell in that position was full.
    //         }
    //       }
    //     }
    //     return possibleMoves;
    //   }
    /**
   * Returns a random move given state and turnIndexBeforeMove.
   */
    function getRandomMove(state, turnIndexBeforeMove) {
        for (var i = 0; i < gameLogic.DECK_SIZE; i++) {
            for (var j = 0; j < gameLogic.DECK_SIZE; j++) {
                try {
                    return gameLogic.createMove(state, [i, j], 30, turnIndexBeforeMove, state.round, state.scores);
                }
                catch (e) {
                }
            }
        }
        return null;
    }
    aiService.getRandomMove = getRandomMove;
    /**
     * Returns the move that the computer player should do for the given state.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(move, alphaBetaLimits) {
        // We use alpha-beta search, where the search states are TicTacToe moves.
        //return alphaBetaService.alphaBetaDecision(
        //   move, move.turnIndexAfterMove, getNextStates, getStateScoreForIndex0, null, alphaBetaLimits);
        return getRandomMove(move.stateAfterMove, move.turnIndexAfterMove);
    }
    aiService.createComputerMove = createComputerMove;
    function getStateScoreForIndex0(move, playerIndex) {
        var endMatchScores = move.endMatchScores;
        if (endMatchScores) {
            return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
                : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
                    : 0;
        }
        return 0;
    }
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map