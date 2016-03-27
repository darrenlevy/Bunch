var gameLogic;
(function (gameLogic) {
    gameLogic.DECK_SIZE = 16;
    gameLogic.TOTAL_ROUNDS = 2;
    gameLogic.NUMBER_OF_PLAYERS = 2;
    gameLogic.NUMBER_OF_ELEMENTS_PER_CARD = 4;
    gameLogic.NUMBER_OF_TYPES = 3;
    /** Returns the initial deck, which is a list of cards. */
    function getInitialDecks() {
        return [makeDeck(), makeDeck(), makeDeck()];
    }
    function makeDeck() {
        var deck = [];
        var keys = [];
        for (var i = 0; i < gameLogic.DECK_SIZE; i++) {
            var card = [];
            var key = "";
            do {
                card = [getRandomSymbol(), getRandomCount(), getRandomColor(), getRandomBorder()];
                key = card[0] + card[1] + card[2] + card[3];
            } while (keys.indexOf(key) !== -1);
            keys[i] = key;
            deck[i] = card;
        }
        return deck;
    }
    function getRandomSymbol() {
        var symbols = ["♡", "✰", "☺"];
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
     * Returns 0 or more points if cards represent valid move, -1 otherwise
     */
    function pointsForMove(cards, seconds) {
        var points = 30 - seconds > 0 ? 30 - seconds : 0;
        if (cards.length === 0) {
            return 30 - seconds > 10 ? 10 : 30 - seconds > 0 ? 30 - seconds : 0;
        }
        else if (cards.length !== gameLogic.NUMBER_OF_TYPES) {
            return -1;
        }
        for (var i = 0; i < gameLogic.NUMBER_OF_ELEMENTS_PER_CARD; i++) {
            var symbols = [];
            for (var z = 0; z < cards.length; z++) {
                var symbol = cards[z][i];
                if (symbols.indexOf(symbol) == -1) {
                    symbols.push(symbol);
                }
            }
            points += symbols.length * 3;
            if (symbols.length !== 1 && symbols.length !== gameLogic.NUMBER_OF_TYPES) {
                return -1;
            }
        }
        return points;
    }
    gameLogic.pointsForMove = pointsForMove;
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
        if (!stateBeforeMove) {
            stateBeforeMove = angular.copy(stateTransition.move.stateAfterMove);
            stateBeforeMove.bunches = [];
            stateBeforeMove.round = 1;
            stateBeforeMove.scores = [0, 0];
        }
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