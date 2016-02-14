describe("In Bunches", function () {
    var OK = true;
    var ILLEGAL = false;
    var PLAYER_1_TURN = 0;
    var PLAYER_2_TURN = 1;
    var NO_ONE_TURN = -1;
    var NO_ONE_WINS = null;
    var PLAYER_1_WINS = [1, 0];
    var PLAYER_2_WINS = [0, 1];
    var VALID_MOVE = [0, 4, 8];
    var INVALID_MOVE = [0, 1, 2];
    var NO_PREVIOUS_MOVE = null;
    var TIE_SCORE = [0, 0];
    var SECONDS = 10;
    var NO_ROUND = 0;
    var FIRST_ROUND = 1;
    var SECOND_ROUND = 2;
    var LAST_ROUND = 3;
    var NO_SCORE = [0, 0];
    var FIRST_SCORE = [600, 0];
    var FIRST_ROUND_SCORE = [600, 600];
    var SECOND_SCORE = [600, 1200];
    var SECOND_ROUND_SCORE = [1200, 1200];
    var LAST_ROUND_SCORE = [1800, 1800];
    var THIRD_SCORE = [1800, 1200];
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
    function expectMove(isOk, turnIndexBeforeMove, deck, previousCardIndicies, cardIndices, seconds, previousRound, nextRound, previousScores, nextScores, turnIndexAfterMove, endMatchScores) {
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
        var stateTransition = {
            turnIndexBeforeMove: turnIndexBeforeMove,
            stateBeforeMove: { deck: deck, bunches: beforeMoveBunches, round: previousRound, scores: previousScores },
            move: {
                endMatchScores: endMatchScores,
                turnIndexAfterMove: turnIndexAfterMove,
                stateAfterMove: { deck: deck,
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
    it("make a valid move from initial state is OK", function () {
        expectMove(OK, PLAYER_1_TURN, DECK, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("make a valid move from initial state, but setting the turn to yourself is illegal", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECK, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_1_TURN, NO_ONE_WINS);
    });
    it("make a valid move from initial state and winning is illegal", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECK, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, NO_ONE_TURN, PLAYER_1_WINS);
    });
    it("making illegal move from initial state is illegal", function () {
        expectMove(ILLEGAL, PLAYER_1_TURN, DECK, NO_PREVIOUS_MOVE, INVALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, NO_SCORE, FIRST_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a valid move to end round 1 is OK", function () {
        expectMove(OK, PLAYER_2_TURN, DECK, VALID_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, SECOND_ROUND, FIRST_SCORE, FIRST_ROUND_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes am invalid move to end round 1 is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECK, VALID_MOVE, INVALID_MOVE, SECONDS, FIRST_ROUND, SECOND_ROUND, FIRST_SCORE, FIRST_ROUND_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a valid move, but it's still round 1 is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECK, VALID_MOVE, VALID_MOVE, SECONDS, FIRST_ROUND, FIRST_ROUND, FIRST_SCORE, FIRST_ROUND_SCORE, PLAYER_2_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a valid move to start round 2 is OK", function () {
        expectMove(OK, PLAYER_2_TURN, DECK, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, SECOND_ROUND, SECOND_ROUND, FIRST_ROUND_SCORE, SECOND_SCORE, PLAYER_1_TURN, NO_ONE_WINS);
    });
    it("player 2 makes an invalid move to start round 2 is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECK, NO_PREVIOUS_MOVE, INVALID_MOVE, SECONDS, SECOND_ROUND, SECOND_ROUND, FIRST_ROUND_SCORE, SECOND_SCORE, PLAYER_1_TURN, NO_ONE_WINS);
    });
    it("player 2 makes a move after the game is over is illegal", function () {
        expectMove(ILLEGAL, PLAYER_2_TURN, DECK, NO_PREVIOUS_MOVE, VALID_MOVE, SECONDS, LAST_ROUND, LAST_ROUND, LAST_ROUND_SCORE, LAST_ROUND_SCORE, PLAYER_1_TURN, NO_ONE_WINS);
    });
});
//# sourceMappingURL=gameLogic_test.js.map