type Deck = string[][];
interface Bunches {
  cardIndices: number[];
  seconds: number;
}
interface IState {
  deck: Deck;
  bunches: Bunches[];
  round: number,
  scores: number[]
}

module gameLogic {
  export const DECK_SIZE = 16;
  export const TOTAL_ROUNDS = 2;
  export const NUMBER_OF_PLAYERS = 2;
  export const NUMBER_OF_ELEMENTS_PER_CARD = 4;
  export const NUMBER_OF_TYPES = 3;
    
  /** Returns the initial deck, which is a list of cards. */
  function getInitialDeck(): Deck {
    return makeDeck();
  }
  
  function makeDeck(): Deck {
    let deck: Deck = [];
    for (let i = 0; i < DECK_SIZE; i++) {
        deck[i] = [getRandomSymbol(), getRandomCount(), getRandomColor(), getRandomBorder()];
    }
    return deck;
  }
  
  function getRandomSymbol(): string {
      let symbols = [":)", "$", "#"];
      let index = Math.floor(Math.random()*100 % NUMBER_OF_TYPES);
      return symbols[index];
  }
  
  function getRandomCount(): string{
      let count = Math.floor(Math.random()*100 % NUMBER_OF_TYPES) + 1;
      return String(count);
  }
  
  function getRandomColor(): string {
      let colors = ["red", "orange", "blue"];
      let index = Math.floor(Math.random()*100 % NUMBER_OF_TYPES);
      return colors[index];
  }
  
  function getRandomBorder(): string {
      let borders = ["solid", "dotted", "dashed"];
      let index = Math.floor(Math.random()*100 % NUMBER_OF_TYPES);
      return borders[index];
  }

  export function getInitialState(): IState {
    return {deck: getInitialDeck(), bunches: [], round: 1, scores: [0,0]};
  }

  /**
   * Returns true if the game is over.
   */
  function isGameOver(round: number): boolean {
    return round > TOTAL_ROUNDS;
  }

  /**
   * Returns the winners.
   */
  function getWinner(scores: number[]): number[] {
    if (scores[0] == scores[1]) {
        return [0, 0];
    } else if (scores[0] > scores[1]) {
        return [1, 0];
    } else {
        return [0, 1];
    }
  }
  
  /**
   * Returns true if cards represent valid move, false otherwise
   */
  function pointsForMove(cards: string[][], seconds: number) : number {
      let points = 0;
      for (let i = 0; i < NUMBER_OF_ELEMENTS_PER_CARD; i++) {
          let symbols : string[] = [];
          for (let z = 0; z < cards.length; z++) {
            let symbol = cards[z][i];
            if (symbols.indexOf(symbol) < 0) {
                symbols.push(symbol);
            }
          }
          points += (110 - seconds) * symbols.length;
          if (symbols.length !== 1 && symbols.length !== NUMBER_OF_TYPES) {
              return -1;
          }
      }

      return points;
  }

  /**
   * Returns the move that should be performed when player
   * with index turnIndexBeforeMove makes a move.
   */
  export function createMove(
      stateBeforeMove: IState,
      cardIndices: number[],
      seconds: number,
      turnIndexBeforeMove: number,
      round: number,
      scores:  number[]
  ): IMove {
    if (!stateBeforeMove) { // stateBeforeMove is null in a new match.
      stateBeforeMove = getInitialState();
    }
    let deck: Deck = stateBeforeMove.deck;
    let cards: string[][] = [];
    for (let i = 0; i < cardIndices.length; i++) {
        cards.push(deck[cardIndices[i]]);
    }
    if (isGameOver(round)) {
      throw new Error("Can only make a move if the game is not over!");
    }
    
    if (cards.length < 2) {
      throw new Error("You need at least two cards for a legal move!");
    }
    let points = pointsForMove(cards, seconds);
    if (points < 0) {
        throw new Error("That is not a legal move!");
    }
    let scoresAfterMove = angular.copy(scores);
    scoresAfterMove[turnIndexBeforeMove] += points;
    
    let bunches: Bunches[] = angular.copy(stateBeforeMove.bunches);
    bunches.push({cardIndices: cardIndices, seconds: seconds});
    
    let winner : number[] = null;
    let turnIndexAfterMove: number;
    let roundAfterMove = angular.copy(round);
    
    if (bunches.length % NUMBER_OF_PLAYERS === 1) {
          turnIndexAfterMove = 1 - turnIndexBeforeMove;
    } else {
          turnIndexAfterMove = turnIndexBeforeMove;
          roundAfterMove++;
    }
    if (isGameOver(round)) {
      // Game over.
      winner = getWinner(scoresAfterMove);
      turnIndexAfterMove = -1;
    }
    let stateAfterMove: IState = {deck: deck, bunches: bunches, round: roundAfterMove, scores: scoresAfterMove};
    return {endMatchScores: winner, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove};
  }

  export function checkMoveOk(stateTransition: IStateTransition): void {
    // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
    // to verify that the move is OK.
    let turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
    let stateBeforeMove: IState = stateTransition.stateBeforeMove;
    let move: IMove = stateTransition.move;
    let bunches = stateTransition.move.stateAfterMove.bunches;
    let bunch = bunches[bunches.length - 1];
    let cardIndices = bunch.cardIndices;
    let seconds = bunch.seconds;
    let round = stateBeforeMove.round;
    let scores = stateBeforeMove.scores;
    let expectedMove = createMove(
      stateBeforeMove,
      cardIndices,
      seconds,
      turnIndexBeforeMove,
      round,
      scores
    );
    if (!angular.equals(move, expectedMove)) {
      throw new Error("Move calculated=" + angular.toJson(expectedMove, true) +
          ", move expected=" + angular.toJson(move, true))
    }
  }

  export function forSimpleTestHtml() {
    var move = gameLogic.createMove(null, [0,1,2], 10, 0, 1, []);
    log.log("move=", move);
    var params: IStateTransition = {
      turnIndexBeforeMove: 0,
      stateBeforeMove: null,
      move: move,
      numberOfPlayers: NUMBER_OF_PLAYERS};
    gameLogic.checkMoveOk(params);
  }
}
