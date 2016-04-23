interface SupportedLanguages { en: string, es: string, iw: string, pt: string, zh: string, el: string, fr: string, hi: string};

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
        es: "Reglas de Manojos",
        iw: "חוקים של צרורות",
        pt: "Regras de cachos",
        zh: "串规则",
        el: "Κανόνες Τσαμπιά",
        fr: "Règles de Grappes",
        hi: "गुच्छों के नियम",
      },
      RULES_SLIDE1: {
        en: "You and your opponent take turns finding a Bunch. A Bunch is 3 cards where the number of emoji, color of emoji, the emoji itself and border of the card are all the same or all different.",
        es: "Tu y su oponente se da vuelta para encontrar un manojo. Un manojo es 3 cartas donde el número de emoji, el color de emoji, el propio emoji y el borde de la tarjeta son todos iguales o diferentes.",
        iw: "אתה ולקחת היריב פונה למצוא חבורה. חבורה היא 3 כרטיסים שבהם מספר emoji, הצבע של emoji, האמוג'י עצם הגבול של הכרטיס הם כולם אותו הדבר או שונה זה מזה.",
        pt: "Você e seu oponente se revezam encontrar um Bunch. Um grupo é de 3 cartões onde o número de emoji, cor de emoji, a própria emoji e borda do cartão são todos iguais ou diferentes.",
        zh: "你和你的对手轮流找一束。一堆是3张卡，其中的表情符号的卡号，表情符号的颜色，表情符号本身和边框都相同或各不相同。",
        el: "Εσείς και ο αντίπαλός σας λαμβάνουν τελικά την εξεύρεση μια δέσμη. Ένα μάτσο είναι 3 κάρτες, όπου ο αριθμός των emoji, το χρώμα του emoji, η ίδια η Emoji και σύνορα της κάρτας είναι όλα τα ίδια ή όλα διαφορετικά.",
        fr: "Vous et votre adversaire se relaient trouver un Bunch. A Bunch est de 3 cartes où le nombre de emoji, couleur de emoji, l'emoji lui-même et la frontière de la carte sont tous les mêmes ou tous différents.",
        hi: "आप और अपने प्रतिद्वंद्वी को लेने के लिए एक गुच्छा पाने बदल जाता है। एक गुच्छा 3 कार्ड जहां इमोजी की संख्या, इमोजी के रंग, इमोजी ही है और सीमा कार्ड के सभी एक ही है या सब अलग हैं।",
      },
      RULES_SLIDE2: {
        en: "There are 2 rounds. Player 1 starts the first round. Player 2 starts the second round. You receive 3 point for similarities and 9 points for differences.",
        es: "Hay 2 rondas. El jugador 1 comienza la primera ronda. El jugador 2 se inicia la segunda ronda. Recibe 3 punto por similitudes y 9 puntos por diferencias.",
        iw: "ישנם 2 סיבובים. שחקן 1 מתחיל את הסיבוב הראשון. שחקן 2 מתחיל הסיבוב השני. אתה מקבל 3 נקודות עבור דמיון ו -9 נקודות עבור הבדלים.",
        pt: "Existem 2 rodadas. Jogador 1 começa a primeira rodada. Jogador 2 começa a segunda rodada. Você recebe 3 pontos de semelhanças e 9 pontos para as diferenças.",
        zh: "有2个回合。玩家1开始了第一轮。玩家2开始第二轮。您会收到3点相似之处和9点的差异。",
        el: "Υπάρχουν 2 γύρους. Παίκτης 1 ξεκινά τον πρώτο γύρο. Παίκτης 2 ξεκινά τον δεύτερο γύρο. Θα λάβετε 3 σημείων για τις ομοιότητες και τις 9 μονάδες για τις διαφορές.",
        fr: "Il y a 2 tours. Le joueur 1 commence le premier tour. Joueur 2 commence le deuxième tour. Vous recevez 3 points pour les similitudes et 9 points pour les différences.",
        hi: "वहाँ 2 राउंड हैं। खिलाड़ी 1 पहले दौर शुरू होता है। खिलाड़ी 2 दूसरे दौर शुरू होता है। आप समानता के लिए 3 बिंदु और मतभेद के लिए 9 अंक प्राप्त करते हैं।",
      },
      CLOSE:  {
        en: "Close",
        es: "Cerca",
        iw: "סגור",
        pt: "Fechar",
        zh: "继续游戏",
        el: "Κοντά",
        fr: "Fermer",
        hi: "बंद करे",
      },
      PLAYER:  {
        en: "Player",
        es: "Jugador",
        iw: "שחקן",
        pt: "Jogador",
        zh: "播放机",
        el: "Παίχτης",
        fr: "Joueur",
        hi: "खिलाड़ी",
      },
      PRESS_TO_START:  {
        en: "Press to start",
        es: "Pulse para empezar",
        iw: "לחץ על כדי להתחיל",
        pt: "Pressione para iniciar",
        zh: "按下启动",
        el: "Πατήστε για να ξεκινήσετε",
        fr: "Appuyez sur pour démarrer",
        hi: "प्रेस शुरू करने के लिए",
      },
      WINS:  {
        en: "Wins",
        es: "Gana",
        iw: "ניצחונות",
        pt: "vitórias",
        zh: "胜",
        el: "νίκες",
        fr: "Victoires",
        hi: "जीत",
      },
      TIE:  {
        en: "Tie",
        es: "Empata",
        iw: "עניבה",
        pt: "Gravata",
        zh: "领带",
        el: "Γραβάτα",
        fr: "Attacher",
        hi: "टाई",
      },
      ROUND:  {
        en: "Round",
        es: "Ronda",
        iw: "עָגוֹל",
        pt: "Volta",
        zh: "回合",
        el: "Γύρος",
        fr: "Rond",
        hi: "गोल",
      },     
      BONUS_POINTS:  {
        en: "Bonus Points",
        es: "Puntos Extra",
        iw: "נקודות בונוס",
        pt: "Pontos bônus",
        zh: "奖励积分",
        el: "Πόντοι μπόνους",
        fr: "Points bonus",
        hi: "बोनस अंक",
      },
      I_CANNOT_FIND_A_BUNCH:  {
        en: "I cannot find a bunch",
        es: "No puedo encontrar un Manojo",
        iw: "אני לא יכול למצוא חבורה",
        pt: "Não consigo encontrar uma Bunch",
        zh: "我找不到一束",
        el: "Δεν μπορώ να βρω μια δέσμη",
        fr: "Je ne peux pas trouver un Bunch",
        hi: "मैं एक गुच्छा नहीं मिल सकता",
      },
    };
  }

  function animationEndedCallback() {
    $rootScope.$apply(function () {
      log.info("Animation ended");
      animationEnded = true;
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
      sendComputerMove();
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
 
  export function isBlue(index: number): boolean {
    return state.decks[deckIndex][index][2] == "blue";
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
  
  function alreadyPlayedCard(index: number): boolean {
   if (state && state.bunches.length % 2 == 1) {
      let lastBunchIndex = state.bunches.length-1;
      let lastBunch = state.bunches[lastBunchIndex];
      return lastBunch.cardIndices.indexOf(index) !== -1; 
    } 
    return false;
  }
  
  export function shouldHintCardIndex(index: number): boolean {
      if (gameIsOver()) {
        return false;
      }
      if (seconds !== 20 && seconds !== 30 && seconds !== 35) {
        return false;
      }
      let deck = state.decks[state.round-1]
      let possibleMoves = aiService.getPossibleMoves(state, move.turnIndexAfterMove);
      let validMoveExists = false;
      for (let i = 0; i < possibleMoves.length; i++) {
        let possibleMove = possibleMoves[i];
        let bunches = possibleMove.stateAfterMove.bunches;
        let lastBunch = bunches[bunches.length-1];
        let alreadyPlayed = false;
        for (let y = 0; y < lastBunch.cardIndices.length; y++) {
          alreadyPlayed = alreadyPlayedCard(lastBunch.cardIndices[y]);
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
  
  export function resultIsBlue(playerIndex: number, cardIndex: number): boolean {
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
    return state.decks[roundIndex][index][2] == "blue";
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
