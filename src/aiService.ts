module aiService {
  /** Returns the move that the computer player should do for the given state in move. */
  export function findComputerMove(move: IMove): IMove {
    return createComputerMove(move,
        // at most 1 second for the AI to choose a move (but might be much quicker)
        {millisecondsLimit: 1000});
  }

  /**
   * Returns all the possible moves for the given state and turnIndexBeforeMove.
   * Returns an empty array if the game is over.
   */
  export function getPossibleMoves(state: IState, turnIndexBeforeMove: number): IMove[] {
    let seconds = 10;
    let possibleMoves: IMove[] = [];
    for (let i = 0; i < gameLogic.DECK_SIZE; i++) {
      for (let j = i+1; j < gameLogic.DECK_SIZE; j++) {
          for (let k = j+1; k < gameLogic.DECK_SIZE; k++) {
            try {
                if (state.bunches.length % 2 == 1 && state.bunches[state.bunches.length-1].cardIndices.sort() == [i, j, k].sort()) {
                    continue; //Don't let AI make same move as last player
                }
                let deck = state.decks[state.round-1];
                let card1 = deck[i];
                let card2 = deck[j];
                let card3 = deck[k];
                let points = gameLogic.pointsForMove([card1, card2, card3], seconds);
                
                if (points >= 0) {
                    possibleMoves.push(gameLogic.createMove(state, [i, j, k], seconds, turnIndexBeforeMove, state.round, state.scores));
                }
            } catch (e) {
                // Invalid move
            }
          }
      }
    }

    if (possibleMoves.length == 0) {
        possibleMoves.push(gameLogic.createMove(state, [], seconds, turnIndexBeforeMove, state.round, state.scores));
    }

    return possibleMoves;
  }

  /**
   * Returns the move that the computer player should do for the given state.
   * alphaBetaLimits is an object that sets a limit on the alpha-beta search,
   * and it has either a millisecondsLimit or maxDepth field:
   * millisecondsLimit is a time limit, and maxDepth is a depth limit.
   */
  export function createComputerMove(
      move: IMove, alphaBetaLimits: IAlphaBetaLimits): IMove {
    // We use alpha-beta search, where the search states are TicTacToe moves.
   //return alphaBetaService.alphaBetaDecision(
   //     move, move.turnIndexAfterMove, getNextStates, getStateScoreForIndex0, null, alphaBetaLimits);
   let possibleMoves = getNextStates(move,move.turnIndexAfterMove)
   return possibleMoves[possibleMoves.length-1];
  }

  function getStateScoreForIndex0(move: IMove, playerIndex: number): number {
    let endMatchScores = move.endMatchScores;
    if (endMatchScores) {
      return endMatchScores[0] > endMatchScores[1] ? Number.POSITIVE_INFINITY
          : endMatchScores[0] < endMatchScores[1] ? Number.NEGATIVE_INFINITY
          : 0;
    }
    return 0;
  }

  function getNextStates(move: IMove, playerIndex: number): IMove[] {
    return getPossibleMoves(move.stateAfterMove, playerIndex);
  }
}