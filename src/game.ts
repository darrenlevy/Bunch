interface SupportedLanguages { en: string, es: string};
interface Translations {
  [index: string]: SupportedLanguages;
}

module game {
  // I export all variables to make it easy to debug in the browser by
  // simply typing in the console:
  // game.state
  export let animationEnded = false;
  export let canMakeMove = false;
  export let isComputerTurn = false;
  export let move: IMove = null; //prior move
  export let state: IState = null;
  export let isHelpModalShown: boolean = false;
  export let cards: number[] = [];
  export let cardsPlayed: number[] = [];
  export let seconds: number = 0;
  export let player1Score: number = 0;
  export let player2Score: number = 0;
  export let deckIndex: number = 0;
  export let resultRound: number = 1;
  export let roundStarted = false;
  let timer : ng.IPromise<any>;
  export let showResults = false;

  export function init() {
    translate.setTranslations(getTranslations());
    translate.setLanguage('en');
    log.log("Translation of 'RULES_OF_BUNCHES' is " + translate('RULES_OF_BUNCHES'));
    resizeGameAreaService.setWidthToHeight(3/2);
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

    let w: any = window;
    if (w["HTMLInspector"]) {
      setInterval(function () {
        w["HTMLInspector"].inspect({
          excludeRules: ["unused-classes", "script-placement"],
        });
      }, 3000);
    }  
  }
  
  function getTranslations(): Translations {
    return {
      RULES_OF_BUNCHES: {
        en: "Rules of Bunches",
        es: "Reglas de Los Manojos",
      },
      RULES_SLIDE1: {
        en: "You and your opponent take turns finding a Bunch. A Bunch is 3 cards where the number of emoji, color of emoji, the emoji itself and border of the card are all the same or all different.",
        es: "Usted y su oponente se da vuelta para encontrar un manojo. Un manojo es 3 cartas donde el número de emoji, el color de emoji, el propio emoji y el borde de la tarjeta son todos iguales o diferentes.",
      },
      RULES_SLIDE2: {
        en: "There are 2 rounds. Player 1 starts the first round. Player 2 starts the second round. You receive 1 point for similarities and 3 points for differences.",
        es: "Hay 2 rondas. El jugador 1 comienza la primera ronda. El jugador 2 se inicia la segunda ronda. Recibe 1 punto por similitudes y 3 puntos por diferencias.",
      },
      CLOSE:  {
        en: "Close",
        es: "Cerca",
      },
    };
  }

  function animationEndedCallback() {
    $rootScope.$apply(function () {
      log.info("Animation ended");
      animationEnded = true;
      //sendComputerMove();
    });
  }

  function sendComputerMove() {
    if (!isComputerTurn) {
      return;
    }
    isComputerTurn = false; // to make sure the computer can only move once.
    moveService.makeMove(aiService.findComputerMove(move));
  }

  function updateUI(params: IUpdateUI): void {
    log.info("Game got updateUI:", params);
    animationEnded = false;
    move = params.move;
    state = move.stateAfterMove;
    if (!state) {
      state = gameLogic.getInitialState();
      move.endMatchScores = [0,0];
      move.turnIndexAfterMove = 0;
      move.stateAfterMove = state;
    }
    resetBoard(state.scores);
    
    canMakeMove = move.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === move.turnIndexAfterMove; // it's my turn
    deckIndex = canMakeMove ? state.round - 1 : deckIndex;
    if (move.turnIndexAfterMove < 0) {
        $interval.cancel(timer);
    }
    // Is it the computer's turn?
    isComputerTurn = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
    if (isComputerTurn) {
      // To make sure the player won't click something and send a move instead of the computer sending a move.
      canMakeMove = false;
      //if (!state.bunches) {
        sendComputerMove();
      //}
    }
  }
  
  export function gameIsOver(): boolean {
      return move.turnIndexAfterMove < 0;
  }
  
  export function isWinner(playerIndex: number): boolean {
      if (!gameIsOver()) {
        return false;
      }
      if (playerIndex == 0) {
          return player1Score == player2Score;
      }
      if (playerIndex == 1) {
          return player1Score > player2Score;
      }
      if (playerIndex == 2) {
          return player1Score < player2Score;
      }
      return false;
  }
  
  export function cardClicked(cardIndex: number) {
      if (state && state.bunches.length % 2 == 1) {
        let lastBunchIndex = state.bunches.length-1;
        let lastBunch = state.bunches[lastBunchIndex];
        if (lastBunch.seconds <= seconds && lastBunch.cardIndices.indexOf(cardIndex) !== -1) {
            return;
        } 
      }
      let index = cards.indexOf(cardIndex)
      if (index == -1) {
          cards.push(cardIndex);
      } else {
          cards.splice(index, 1);
      }
      if (cards.length >= 3) {
          cardsPlayed = cards;
          submitMove();
      } else {
         cardsPlayed = [];
      }
  }
  
  export function isCurrentPlayerIndex(playerIndex: number): boolean {
      return move.turnIndexAfterMove == playerIndex;
  }
  
  export function startClicked(): void {
      if (gameIsOver() || !canMakeMove) {
          return;
      }
      roundStarted = true;
      cardsPlayed = [];
      timer = $interval(function () {
                seconds++;
       }, 1000);
  }
  
  function resetBoard(scores: number[]) {
       $interval.cancel(timer);
       roundStarted = false;
       cards = [];
       seconds = 0;
       player1Score = scores[0];
       player2Score = scores[1];    
  }

  export function passMove (): void {
      if (canMakeMove) {
        cards = [];
        submitMove();
      }
  }

  export function submitMove (): void {
    if (window.location.search === '?throwException') { // to test encoding a stack trace with sourcemap
      throw new Error("Throwing the error because URL has '?throwException'");
    }
    if (!canMakeMove) {
      return;
    }
    try {
      let nextMove = gameLogic.createMove(
          state, cards, seconds, move.turnIndexAfterMove, state.round, state.scores);  
      canMakeMove = false; // to prevent making another move
      moveService.makeMove(nextMove);
    } catch (e) {
      log.info(["Invalid cards:", cards]);
      cards = [];
      return;
    }
  }
 
  export function getEmoji(index: number): String {
    let emoji = "";
    let count = parseInt(state.decks[deckIndex][index][1])
    for (let i = 0; i < count; i++) {
        emoji += state.decks[deckIndex][index][0] + " ";
    }
    return emoji;
  }
 
  
  export function isGreen(index: number): boolean {
    return state.decks[deckIndex][index][2] == "green";
  }
  
  export function isPink(index: number): boolean {
    return state.decks[deckIndex][index][2] == "pink";
  }
  
  export function isOrange(index: number): boolean {
    return state.decks[deckIndex][index][2] == "orange";
  }
  
  export function isSolid(index: number): boolean {
    return state.decks[deckIndex][index][3] == "solid";
  }
  
  export function isDotted(index: number): boolean {
    return state.decks[deckIndex][index][3] == "dotted";
  }
  
  export function isDouble(index: number): boolean {
    return state.decks[deckIndex][index][3] == "double";
  }
  
  export function shouldFlip(index: number): boolean {
    if (state && state.bunches.length % 2 == 1) {
        let lastBunchIndex = state.bunches.length-1;
        let lastBunch = state.bunches[lastBunchIndex];
        if (lastBunch.seconds <= seconds && lastBunch.cardIndices.indexOf(index) !== -1) {
            if (cards.indexOf(index) !== -1) {
                cards.splice(cards.indexOf(index), 1);
            }
            return true;
        } 
    } 
    return false;
  }
  
  export function shouldHintCardIndex(index: number): boolean {
      if (gameIsOver()) {
          return false;
      }
      if (seconds < 20) {
          return false;
      }
      let deck = state.decks[state.round-1]
      let possibleMoves = aiService.getPossibleMoves(state, move.turnIndexAfterMove)
      let validMoveExists = false;
      for (let i = 0; i < possibleMoves.length; i++) {
          let possibleMove = possibleMoves[i];
          let bunches = possibleMove.stateAfterMove.bunches;
          let lastBunch = bunches[bunches.length-1];
          let alreadyPlayed = false;
          for (let y = 0; y < lastBunch.cardIndices.length; y++) {
              alreadyPlayed = shouldFlip(lastBunch.cardIndices[y]);
              if (alreadyPlayed) {
                  break;
              }
          }
          if (alreadyPlayed) {
              continue;
          }
          validMoveExists = true
          if (seconds == 20) {
            return lastBunch.cardIndices[0] == index;
          } else if (seconds == 30) {
              return lastBunch.cardIndices[1] == index
          }
      }
      return -1 == index && seconds > 30 && !validMoveExists;
  }
  
  
  export function shouldShakeCard(index: number): boolean {
    if (cardsPlayed.indexOf(index) !== -1) {
       let borders : string[] = [];
       for (let i = 0; i < 3; i++) {
           let cardPlayed = cardsPlayed[i];
           let border = state.decks[state.round-1][cardPlayed][3];
           if (borders.indexOf(border) === -1) {
               borders.push(border);
           }
       }
       return borders.length !== 1 && borders.length !== 3;
    } 
    return false;
  }
  
  export function shouldBounceEmoji(index: number): boolean {
    if (cardsPlayed.indexOf(index) !== -1) {
       let emojis : string[] = [];
       let counts : string[] = [];
       let colors : string[] = [];
       for (let i = 0; i < 3; i++) {
           let cardPlayed = cardsPlayed[i];
           let emoji = state.decks[state.round-1][cardPlayed][0];
           let count = state.decks[state.round-1][cardPlayed][1];
           let color = state.decks[state.round-1][cardPlayed][2];

           if (emojis.indexOf(emoji) === -1) {
               emojis.push(emoji);
           }
           if (counts.indexOf(count) === -1) {
               counts.push(count);
           }
           if (colors.indexOf(color) === -1) {
               colors.push(color);
           }
       }
       return (emojis.length !== 1 && emojis.length !== 3) ||
                (counts.length !== 1 && counts.length !== 3) ||
                    (colors.length !== 1 && colors.length !== 3);
    } 
    return false;
  }
  
  export function resultRoundClicked(round: number) {
      if (resultRound == round ) {
          showResults = !showResults;
      }
      resultRound = round;
  }
  
  export function resultIsGreen(playerIndex: number, cardIndex: number): boolean {
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return false;
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return false;
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    return state.decks[roundIndex][index][2] == "green";
  }
  
  export function resultIsPink(playerIndex: number, cardIndex: number): boolean {
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return false;
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return false;
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    return state.decks[roundIndex][index][2] == "pink";
  }
  
  export function resultIsOrange(playerIndex: number, cardIndex: number): boolean {
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return false;
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return false;
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    return state.decks[roundIndex][index][2] == "orange";
  }
  
  export function resultIsSolid(playerIndex: number, cardIndex: number): boolean {
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return false;
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return false;
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    return state.decks[roundIndex][index][3] == "solid";
  }
  
  export function resultIsDotted(playerIndex: number, cardIndex: number): boolean {
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return false;
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return false;
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    return state.decks[roundIndex][index][3] == "dotted";
  }
  
  export function resultIsDouble(playerIndex: number, cardIndex: number): boolean {
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return false;
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return false;
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    return state.decks[roundIndex][index][3] == "double";
  }
  
  export function getResultEmoji(playerIndex: number, cardIndex: number): String {
    let emoji = "";
    let roundIndex = resultRound - 1;
    if (roundIndex % 2 == 1) {
        playerIndex = 1 - playerIndex;
    }
    
    if (state.bunches.length <= roundIndex*2+playerIndex) {
        return "";
    }
    if (state.bunches[roundIndex*2+playerIndex].cardIndices.length == 0) {
        return "";
    }
    let index = state.bunches[roundIndex*2+playerIndex].cardIndices[cardIndex];
    
    
    let count = parseInt(state.decks[roundIndex][index][1]);
    for (let i = 0; i < count; i++) {
        emoji += state.decks[roundIndex][index][0];
    }
    return emoji;
  }
  
  
  
  
  

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

  export function clickedOnModal(evt: Event) {
    if (evt.target === evt.currentTarget) {
      evt.preventDefault();
      evt.stopPropagation();
      isHelpModalShown = false;
    }
    return true;
  }
}

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
  .run(function () {
    $rootScope['game'] = game;
    game.init();
  });
