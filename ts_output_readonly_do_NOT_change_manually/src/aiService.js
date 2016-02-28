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