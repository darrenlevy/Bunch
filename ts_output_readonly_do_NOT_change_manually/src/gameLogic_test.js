describe("In Bunches", function () {
    var OK = true;
    var ILLEGAL = false;
    var PLAYER_1_TURN = 0;
    var PLAYER_2_TURN = 1;
    var NO_ONE_TURN = -1;
    var NO_ONE_WINS = null;
    var PLAYER_1_WINS = [1, 0];
    var PLAYER_2_WINS = [0, 1];
    var NO_MOVE = [];
    var VALID_MOVE = [0, 4, 8];
    var INVALID_MOVE = [0, 1, 2];
    var INVALID_1_CARD_MOVE = [0];
    var NO_PREVIOUS_MOVE = null;
    var TIE_SCORE = [0, 0];
    var SECONDS = 5;
    var NO_ROUND = 0;
    var FIRST_ROUND = 1;
    var LAST_ROUND = 2;
    var NO_SCORE = [0, 0];
    var NO_MOVE_SCORE = [5, 0];
    var FIRST_SCORE = [11, 0];
    var FIRST_ROUND_SCORE = [11, 11];
    var BEFORE_LAST_SCORE = [20, 19];
    var LAST_ROUND_SCORE = [20, 19];
    var LAST_ROUND_SCORE_PLAYER_2_WINS = [20, 35];
    var LAST_ROUND_SCORE_TIE = [20, 20];
    var NO_DECK = null;
    var DECK = [
        [':|', '1', 'red', 'solid'],
        [':|', '2', 'red', 'solid'],
        [':|', '3', 'red', 'dotted'],
        [':|', '4', 'red', 'dashed'],
        [';)', '1', 'red', 'solid'],
        [';)', '2', 'red', 'solid'],
        [';)', '3', 'red', 'dotted'],
        [';)', '4', 'red', 'dashed'],
        [':)', '1', 'red', 'solid'],
        [':)', '2', 'red', 'solid'],
        [':)', '3', 'red', 'dotted'],
        [':)', '4', 'red', 'dashed'],
        [':(', '1', 'red', 'solid'],
        [':(', '2', 'red', 'solid'],
        [':(', '3', 'red', 'dotted'],
        [':(', '4', 'red', 'dashed'],
    ];
    var DECKS = [DECK, DECK, DECK];
    function expectMove(isOk, turnIndexBeforeMove, decks, previousCardIndicies, cardIndices, seconds, previousRound, nextRound, previousScores, nextScores, turnIndexAfterMove, endMatchScores) {
        var beforeMoveBunches = [];
        var beforeNumberOfBunches = (previousRound - 1) * 2;
        if (previousRound !== nextRound) {
            beforeNumberOfBunches += 1;
        }
        for (var i = 0; i < beforeNumberOfBunches; i++) {
            beforeMoveBunches.push({ cardIndices: previousCardIndicies, seconds: seconds });
        }
        var bunches = angular.copy(beforeMoveBunches);
        bunches.push({ cardIndices: cardIndices, seconds: seconds });
        var stateBeforeMove = null;
        if (decks) {
            stateBeforeMove = { decks: decks, bunches: beforeMoveBunches, round: previousRound, scores: previousScores };
        }
        var stateTransition = {
            turnIndexBeforeMove: turnIndexBeforeMove,
            stateBeforeMove: stateBeforeMove,
            move: {
                endMatchScores: endMatchScores,
                turnIndexAfterMove: turnIndexAfterMove,
                stateAfterMove: { decks: decks,
                    bunches: bunches,
                    round: nextRound,
                    scores: nextScores }
            },
            numberOfPlayers: 2
        };
        if (isOk) {
            gameLogic.checkMoveOk(stateTransition);
        }
        else {
            // We expect an exception to be thrown :)
            var didThrowException = false;
            try {
                gameLogic.checkMoveOk(stateTransition);
            }
            catch (e) {
                didThrowException = true;
            }
            if (!didThrowException) {
                throw new Error("We expect an illegal move, but checkMoveOk didn't throw any exception!");
            }
        }
    }
    function expectTrue(statement) {
        if (!statement) {
            throw new Error("Look for true, got false");
        }
    }
    it("random deck is created OK", function () {
        expectTrue(gameLogic.getInitialState().decks !== null);
        ;
    });
    it("initial state is created OK", function () {
        expectTrue(gameLogic.createMove(null, NO_MOVE, SECONDS, PLAYER_1_TURN, FIRST_ROUND, NO_SCORE) !== null);
    });
    it("make a valid move from initial state is OK", function () {
        expectMove(OK, PLAYER_1_TURN, DECKS, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("make an invalid 1 card move from initial state is ILLEGAL", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECKS, NO_PREVIOUS_MOVE, INVALID_1_CARD_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("make no move from initial state is OK", function () {
        expectMove(OK, PLAYER_1_TURN, DECKS, NO_PREVIOUS_MOVE, NO_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, NO_MOVE_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("make a valid move from initial state, but setting the turn to yourself is illegal", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECKS, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_1_TURN, NO_ONE_WINS);
    });
    it("make a valid move from initial state and winning is illegal", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECKS, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, NO_ONE_TURN, PLAYER_1_WINS);
    });
    it("making illegal move from initial state is illegal", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECKS, NO_PREVIOUS_MOVE, INVALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a valid move to end round 1 is OK", function () {
        expectMove(OK, PLAYER_2_TURN, DECKS, VALID_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, LAST_ROUND, FIRST_SCORE, FIRST_ROUND_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes am invalid move to end round 1 is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECKS, VALID_MOVE, INVALID_MOVE, SECONDS, FIRST_ROUND, LAST_ROUND, FIRST_SCORE, FIRST_ROUND_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a valid move, but it's still round 1 is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECKS, VALID_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, FIRST_SCORE, FIRST_ROUND_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a valid move to end game and lose is OK", function () {
        expectMove(OK, PLAYER_2_TURN, DECKS, VALID_MOVE, NO_MOVE, SECONDS + 5, LAST_ROUND, LAST_ROUND + 1, BEFORE_LAST_SCORE, LAST_ROUND_SCORE, NO_ONE_TURN, PLAYER_1_WINS);
    });
    it("player 2 makes a valid move to end game and win is OK", function () {
        expectMove(OK, PLAYER_2_TURN, DECKS, VALID_MOVE, VALID_MOVE, SECONDS - 5, LAST_ROUND, LAST_ROUND + 1, BEFORE_LAST_SCORE, LAST_ROUND_SCORE_PLAYER_2_WINS, NO_ONE_TURN, PLAYER_2_WINS);
    });
    it("player 2 makes a valid move to end game and ties OK", function () {
        expectMove(OK, PLAYER_2_TURN, DECKS, VALID_MOVE, NO_MOVE, SECONDS + 4, LAST_ROUND, LAST_ROUND + 1, BEFORE_LAST_SCORE, LAST_ROUND_SCORE_TIE, NO_ONE_TURN, TIE_SCORE);
    });
    it("player 2 makes a move after the game is over is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECKS, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, LAST_ROUND + 1, LAST_ROUND + 1, LAST_ROUND_SCORE, LAST_ROUND_SCORE, PLAYER_1_TURN, NO_ONE_WINS);
    });
});
//# sourceMappingURL=gameLogic_test.js.map