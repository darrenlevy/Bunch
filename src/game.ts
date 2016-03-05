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
  export let move: IMove = null;
  export let state: IState = null;
  export let isHelpModalShown: boolean = false;
  export let cards: number[] = [];
  export let seconds: number = 0;
  export let player1Score: number = 0;
  export let player2Score: number = 0;
  export let deckIndex: number = 0;
  let timer : ng.IPromise<any>;

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
        en: "You and your opponent take turns finding a Bunch. A Bunch is 2 or 3 cards where the number of emoji, color of emoji, the emoji itself and border of the card are all the same or all different.",
        es: "Usted y su oponente se da vuelta para encontrar un manojo. Un manojo es 2 o 3 cartas donde el número de emoji, el color de emoji, el propio emoji y el borde de la tarjeta son todos iguales o diferentes.",
      },
      RULES_SLIDE2: {
        en: "The first player goes, then the second player goes with the same cards for each round. After 3 rounds, the player with the most points wins.",
        es: "El primer jugador pasa, entonces el segundo jugador va con las mismas cartas para cada ronda. Después de 3 rondas, el jugador con más puntos gana.",
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
      sendComputerMove();
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
    }
    resetBoard(state.scores);
    
    canMakeMove = move.turnIndexAfterMove >= 0 && // game is ongoing
      params.yourPlayerIndex === move.turnIndexAfterMove; // it's my turn
    deckIndex = canMakeMove ? state.round - 1 : deckIndex;
    // Is it the computer's turn?
    isComputerTurn = canMakeMove &&
        params.playersInfo[params.yourPlayerIndex].playerId === '';
    if (isComputerTurn) {
      // To make sure the player won't click something and send a move instead of the computer sending a move.
      canMakeMove = false;
      // We calculate the AI move only after the animation finishes,
      // because if we call aiService now
      // then the animation will be paused until the javascript finishes.
      if (!state.bunches) {
        // This is the first move in the match, so
        // there is not going to be an animation, so
        // call sendComputerMove() now (can happen in ?onlyAIs mode)
        sendComputerMove();
      }
    }
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
  }
  
  export function isCurrentPlayerIndex(playerIndex: number): boolean {
      return move.turnIndexAfterMove == playerIndex;
  }
  
  function resetBoard(scores: number[]) {
       $interval.cancel(timer);
       cards = [];
       seconds = 0;
       player1Score = scores[0];
       player2Score = scores[1];
       timer = $interval(function () {
                seconds++;
                if (seconds > 99) {
                $interval.cancel(timer);
                }
       }, 1000);
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
      return;
    }
  }
 
  export function getEmoji(index: number): String {
    let emoji = "";
    let count = parseInt(state.decks[deckIndex][index][1])
    for (let i = 0; i < count; i++) {
        emoji += state.decks[deckIndex][index][0];
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
