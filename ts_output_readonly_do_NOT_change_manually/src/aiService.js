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
    function getPossibleMoves(state, turnIndexBeforeMove) {
        var seconds = 30;
        var possibleMoves = [];
        for (var i = 0; i < gameLogic.DECK_SIZE; i++) {
            for (var j = i + 1; j < gameLogic.DECK_SIZE; j++) {
                for (var k = j + 1; k < gameLogic.DECK_SIZE; k++) {
                    try {
                        if (state.bunches.length % 2 == 1 && state.bunches[state.bunches.length - 1].cardIndices.sort() == [i, j, k].sort()) {
                            continue; //Don't let AI make same move as last player
                        }
                        var deck = state.decks[state.round - 1];
                        var card1 = deck[i];
                        var card2 = deck[j];
                        var card3 = deck[k];
                        var points = gameLogic.pointsForMove([card1, card2, card3], seconds);
                        if (points >= 0) {
                            possibleMoves.push(gameLogic.createMove(state, [i, j, k], seconds, turnIndexBeforeMove, state.round, state.scores));
                        }
                    }
                    catch (e) {
                    }
                }
            }
        }
        if (possibleMoves.length == 0) {
            possibleMoves.push(gameLogic.createMove(state, [], seconds, turnIndexBeforeMove, state.round, state.scores));
        }
        return possibleMoves;
    }
    aiService.getPossibleMoves = getPossibleMoves;
    /**
     * Returns the move that the computer player should do for the given state.
     * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
     * and it has either a millisecondsLimit or maxDepth field:
     * millisecondsLimit is a time limit, and maxDepth is a depth limit.
     */
    function createComputerMove(move, alphaBetaLimits) {
        // We use alpha-beta search, where the search states are TicTacToe moves.
        //return alphaBetaService.alphaBetaDecision(
        //     move, move.turnIndexAfterMove, getNextStates, getStateScoreForIndex0, null, alphaBetaLimits);
        var possibleMoves = getNextStates(move, move.turnIndexAfterMove);
        return possibleMoves[possibleMoves.length - 1];
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
    function getNextStates(move, playerIndex) {
        return getPossibleMoves(move.stateAfterMove, playerIndex);
    }
})(aiService || (aiService = {}));
//# sourceMappingURL=aiService.js.map