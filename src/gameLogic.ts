type Deck = string[][];
interface Bunches {
  cardIndices: number[];
  seconds: number;
}
interface IState {
  decks: Deck[];
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
  function getInitialDecks(): Deck[] {
    return [makeDeck(), makeDeck(), makeDeck()];
  }
  
  function makeDeck(): Deck {
    let deck: Deck = [];

    let keys : string[] = [];
    for (let i = 0; i < DECK_SIZE; i++) {
      let card : string[] = [];
      let key : string = "";
      do {
        card = [getRandomSymbol(), getRandomCount(), getRandomColor(), getRandomBorder()];
        key = card[0]+card[1]+card[2]+card[3];
      } while (keys.indexOf(key) !== -1);
      keys[i] = key;
      deck[i] = card;
    }
    return deck;
  }
  
  function getRandomSymbol(): string {
    let symbols = ["♡", "✰", "☺"];
    let index = Math.floor(Math.random()*100 % NUMBER_OF_TYPES);
    return symbols[index];
  }
  
  function getRandomCount(): string{
    let count = Math.floor(Math.random()*100 % NUMBER_OF_TYPES) + 1;
    return String(count);
  }
  
  function getRandomColor(): string {
    let colors = ["pink", "orange", "green"];
    let index = Math.floor(Math.random()*100 % NUMBER_OF_TYPES);
    return colors[index];
  }
  
  function getRandomBorder(): string {
    let borders = ["solid", "dotted", "double"];
    let index = Math.floor(Math.random()*100 % NUMBER_OF_TYPES);
    return borders[index];
  }

  export function getInitialState(): IState {
    return {decks: getInitialDecks(), bunches: [], round: 1, scores: [0,0]};
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
   * Returns 0 or more points if cards represent valid move, -1 otherwise
   */
  export function pointsForMove(cards: string[][], seconds: number) : number {
    let points = 30 - seconds > 0 ? 30 - seconds : 0;
    if (cards.length === 0) {
      return 30 - seconds > 10 ? 10 : 30 - seconds > 0 ? 30 - seconds : 0;
    } else if (cards.length !== NUMBER_OF_TYPES) {
      return -1;
    } 
    for (let i = 0; i < NUMBER_OF_ELEMENTS_PER_CARD; i++) {
      let symbols : string[] = [];
      for (let z = 0; z < cards.length; z++) {
        let symbol = cards[z][i];
        if (symbols.indexOf(symbol) == -1) {
            symbols.push(symbol);
        }
      }
      points += symbols.length * 3;
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
    if (isGameOver(round)) {
      throw new Error("Can only make a move if the game is not over!");
    }
    if (!stateBeforeMove) { // stateBeforeMove is null in a new match.
      stateBeforeMove = getInitialState();
    }
    let deck: Deck = stateBeforeMove.decks[round-1];
    let cards: string[][] = [];
    for (let i = 0; i < cardIndices.length; i++) {
        cards.push(deck[cardIndices[i]]);
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
    if (isGameOver(roundAfterMove)) {
      // Game over.
      winner = getWinner(scoresAfterMove);
      turnIndexAfterMove = -1;
    }
    let stateAfterMove: IState = {decks: stateBeforeMove.decks, bunches: bunches, round: roundAfterMove, scores: scoresAfterMove};
    return {endMatchScores: winner, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove};
  }

  export function checkMoveOk(stateTransition: IStateTransition): void {
    // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
    // to verify that the move is OK.
    let turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
    let stateBeforeMove: IState = stateTransition.stateBeforeMove;
    if (!stateBeforeMove) {
      stateBeforeMove = angular.copy(stateTransition.move.stateAfterMove);
      stateBeforeMove.bunches = [];
      stateBeforeMove.round = 1;
      stateBeforeMove.scores = [0,0]; 
    }
    
    let move: IMove = stateTransition.move;
    let bunches = stateTransition.move.stateAfterMove.bunches;
    let bunch = bunches[bunches.length - 1];
    let cardIndices = bunch.cardIndices;
    let seconds = bunch.seconds;
    let round = stateBeforeMove ? stateBeforeMove.round : 1;
    let scores = stateBeforeMove ? stateBeforeMove.scores : [0, 0];

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
}
