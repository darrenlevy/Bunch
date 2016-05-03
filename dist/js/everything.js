var gameLogic;
(function (gameLogic) {
    gameLogic.DECK_SIZE = 16;
    gameLogic.TOTAL_ROUNDS = 2;
    gameLogic.NUMBER_OF_PLAYERS = 2;
    gameLogic.NUMBER_OF_ELEMENTS_PER_CARD = 4;
    gameLogic.NUMBER_OF_TYPES = 3;
    /** Returns the initial deck, which is a list of cards. */
    function getInitialDecks() {
        return [makeDeck(), makeDeck(), makeDeck()];
    }
    function makeDeck() {
        var deck = [];
        var keys = [];
        for (var i = 0; i < gameLogic.DECK_SIZE; i++) {
            var card = [];
            var key = "";
            do {
                card = [getRandomSymbol(), getRandomCount(), getRandomColor(), getRandomBorder()];
                key = card[0] + card[1] + card[2] + card[3];
            } while (keys.indexOf(key) !== -1);
            keys[i] = key;
            deck[i] = card;
        }
        return deck;
    }
    function getRandomSymbol() {
        var symbols = ["square", "circle", "rectangle"];
        var index = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES);
        return symbols[index];
    }
    function getRandomCount() {
        var count = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES) + 1;
        return String(count);
    }
    function getRandomColor() {
        var colors = ["pink", "orange", "blue"];
        var index = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES);
        return colors[index];
    }
    function getRandomBorder() {
        var borders = ["solid", "dotted", "double"];
        var index = Math.floor(Math.random() * 100 % gameLogic.NUMBER_OF_TYPES);
        return borders[index];
    }
    function getInitialState() {
        return { decks: getInitialDecks(), bunches: [], round: 1, scores: [0, 0] };
    }
    gameLogic.getInitialState = getInitialState;
    /**
     * Returns true if the game is over.
     */
    function isGameOver(round) {
        return round > gameLogic.TOTAL_ROUNDS;
    }
    /**
     * Returns the winners.
     */
    function getWinner(scores) {
        if (scores[0] == scores[1]) {
            return [0, 0];
        }
        else if (scores[0] > scores[1]) {
            return [1, 0];
        }
        else {
            return [0, 1];
        }
    }
    /**
     * Returns 0 or more points if cards represent valid move, -1 otherwise
     */
    function pointsForMove(cards, seconds) {
        var points = 30 - seconds > 0 ? 30 - seconds : 0;
        if (cards.length === 0) {
            return 30 - seconds > 10 ? 10 : 30 - seconds > 0 ? 30 - seconds : 0;
        }
        else if (cards.length !== gameLogic.NUMBER_OF_TYPES) {
            return -1;
        }
        for (var i = 0; i < gameLogic.NUMBER_OF_ELEMENTS_PER_CARD; i++) {
            var symbols = [];
            for (var z = 0; z < cards.length; z++) {
                var symbol = cards[z][i];
                if (symbols.indexOf(symbol) == -1) {
                    symbols.push(symbol);
                }
            }
            points += symbols.length * 3;
            if (symbols.length !== 1 && symbols.length !== gameLogic.NUMBER_OF_TYPES) {
                return -1;
            }
        }
        return points;
    }
    gameLogic.pointsForMove = pointsForMove;
    /**
     * Returns the move that should be performed when player
     * with index turnIndexBeforeMove makes a move.
     */
    function createMove(stateBeforeMove, cardIndices, seconds, turnIndexBeforeMove, round, scores) {
        if (isGameOver(round)) {
            throw new Error("Can only make a move if the game is not over!");
        }
        if (!stateBeforeMove) {
            stateBeforeMove = getInitialState();
        }
        var deck = stateBeforeMove.decks[round - 1];
        var cards = [];
        for (var i = 0; i < cardIndices.length; i++) {
            cards.push(deck[cardIndices[i]]);
        }
        var points = pointsForMove(cards, seconds);
        if (points < 0) {
            throw new Error("That is not a legal move!");
        }
        var scoresAfterMove = angular.copy(scores);
        scoresAfterMove[turnIndexBeforeMove] += points;
        var bunches = angular.copy(stateBeforeMove.bunches);
        bunches.push({ cardIndices: cardIndices.sort(function (a, b) { return a - b; }), seconds: seconds });
        var winner = null;
        var turnIndexAfterMove;
        var roundAfterMove = angular.copy(round);
        if (bunches.length % gameLogic.NUMBER_OF_PLAYERS === 1) {
            turnIndexAfterMove = 1 - turnIndexBeforeMove;
        }
        else {
            turnIndexAfterMove = turnIndexBeforeMove;
            roundAfterMove++;
        }
        if (isGameOver(roundAfterMove)) {
            // Game over.
            winner = getWinner(scoresAfterMove);
            turnIndexAfterMove = -1;
        }
        var stateAfterMove = { decks: stateBeforeMove.decks, bunches: bunches, round: roundAfterMove, scores: scoresAfterMove };
        return { endMatchScores: winner, turnIndexAfterMove: turnIndexAfterMove, stateAfterMove: stateAfterMove };
    }
    gameLogic.createMove = createMove;
    function checkMoveOk(stateTransition) {
        // We can assume that turnIndexBeforeMove and stateBeforeMove are legal, and we need
        // to verify that the move is OK.
        var turnIndexBeforeMove = stateTransition.turnIndexBeforeMove;
        var stateBeforeMove = stateTransition.stateBeforeMove;
        if (!stateBeforeMove) {
            stateBeforeMove = angular.copy(stateTransition.move.stateAfterMove);
            stateBeforeMove.bunches = [];
            stateBeforeMove.round = 1;
            stateBeforeMove.scores = [0, 0];
        }
        var move = stateTransition.move;
        var bunches = stateTransition.move.stateAfterMove.bunches;
        var bunch = bunches[bunches.length - 1];
        var cardIndices = bunch.cardIndices;
        var seconds = bunch.seconds;
        var round = stateBeforeMove ? stateBeforeMove.round : 1;
        var scores = stateBeforeMove ? stateBeforeMove.scores : [0, 0];
        var expectedMove = createMove(stateBeforeMove, cardIndices, seconds, turnIndexBeforeMove, round, scores);
        if (!angular.equals(move.stateAfterMove.bunches, expectedMove.stateAfterMove.bunches)) {
            throw new Error("Bunches found=" + angular.toJson(move.stateAfterMove.bunches, true) +
                ", bunches expected=" + angular.toJson(expectedMove.stateAfterMove.bunches, true));
        }
        if (!angular.equals(move.stateAfterMove.decks, expectedMove.stateAfterMove.decks)) {
            throw new Error("Deck found=" + angular.toJson(move.stateAfterMove.decks, true) +
                ", deck expected=" + angular.toJson(expectedMove.stateAfterMove.decks, true));
        }
        if (!angular.equals(move.stateAfterMove.round, expectedMove.stateAfterMove.round)) {
            throw new Error("Round found=" + angular.toJson(move.stateAfterMove.round, true) +
                ", round expected=" + angular.toJson(expectedMove.stateAfterMove.round, true));
        }
        if (!angular.equals(move.stateAfterMove.scores, expectedMove.stateAfterMove.scores)) {
            throw new Error("Scores found=" + angular.toJson(move.stateAfterMove.scores, true) +
                ", scores expected=" + angular.toJson(expectedMove.stateAfterMove.scores, true));
        }
        if (!angular.equals(move.endMatchScores, expectedMove.endMatchScores)) {
            throw new Error("endMatchScores found=" + angular.toJson(move.endMatchScores, true) +
                ", endMatchScores expected=" + angular.toJson(expectedMove.endMatchScores, true));
        }
        if (!angular.equals(move.turnIndexAfterMove, expectedMove.turnIndexAfterMove)) {
            throw new Error("turnIndexAfterMove found=" + angular.toJson(move.turnIndexAfterMove, true) +
                ", turnIndexAfterMove expected=" + angular.toJson(expectedMove.turnIndexAfterMove, true));
        }
        if (!angular.equals(move, expectedMove)) {
            throw new Error("Move calculated=" + angular.toJson(expectedMove, true) +
                ", move expected=" + angular.toJson(move, true));
        }
    }
    gameLogic.checkMoveOk = checkMoveOk;
})(gameLogic || (gameLogic = {}));
//# sourceMappingURL=gameLogic.js.map
;
;
var game;
(function (game) {
    // I export all variables to make it easy to debug in the browser by
    // simply typing in the console:
    // game.state
    game.animationEnded = false;
    game.canMakeMove = false;
    game.isComputerTurn = false;
    game.move = null; //prior move
    game.state = null;
    game.isHelpModalShown = false;
    game.cards = [];
    game.cardsPlayed = [];
    game.seconds = 0;
    game.player1Score = 0;
    game.player2Score = 0;
    game.deckIndex = 0;
    game.resultRound = 1;
    game.roundStarted = false;
    var timer;
    game.showResults = false;
    function init() {
        translate.setTranslations(getTranslations());
        translate.setLanguage('en');
        log.log("Translation of 'RULES_OF_BUNCHES' is " + translate('RULES_OF_BUNCHES'));
        resizeGameAreaService.setWidthToHeight(3 / 2);
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
        var w = window;
        if (w["HTMLInspector"]) {
            setInterval(function () {
                w["HTMLInspector"].inspect({
                    excludeRules: ["unused-classes", "script-placement"],
                });
            }, 3000);
        }
    }
    game.init = init;
    function getTranslations() {
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
            CLOSE: {
                en: "Close",
                es: "Cerca",
                iw: "סגור",
                pt: "Fechar",
                zh: "继续游戏",
                el: "Κοντά",
                fr: "Fermer",
                hi: "बंद करे",
            },
            PLAYER: {
                en: "Player",
                es: "Jugador",
                iw: "שחקן",
                pt: "Jogador",
                zh: "播放机",
                el: "Παίχτης",
                fr: "Joueur",
                hi: "खिलाड़ी",
            },
            PRESS_TO_START: {
                en: "Press to start",
                es: "Pulse para empezar",
                iw: "לחץ על כדי להתחיל",
                pt: "Pressione para iniciar",
                zh: "按下启动",
                el: "Πατήστε για να ξεκινήσετε",
                fr: "Appuyez sur pour démarrer",
                hi: "प्रेस शुरू करने के लिए",
            },
            WINS: {
                en: "Wins",
                es: "Gana",
                iw: "ניצחונות",
                pt: "vitórias",
                zh: "胜",
                el: "νίκες",
                fr: "Victoires",
                hi: "जीत",
            },
            TIE: {
                en: "Tie",
                es: "Empata",
                iw: "עניבה",
                pt: "Gravata",
                zh: "领带",
                el: "Γραβάτα",
                fr: "Attacher",
                hi: "टाई",
            },
            ROUND: {
                en: "Round",
                es: "Ronda",
                iw: "עָגוֹל",
                pt: "Volta",
                zh: "回合",
                el: "Γύρος",
                fr: "Rond",
                hi: "गोल",
            },
            BONUS_POINTS: {
                en: "Bonus Points",
                es: "Puntos Extra",
                iw: "נקודות בונוס",
                pt: "Pontos bônus",
                zh: "奖励积分",
                el: "Πόντοι μπόνους",
                fr: "Points bonus",
                hi: "बोनस अंक",
            },
            I_CANNOT_FIND_A_BUNCH: {
                en: "I cannot find a Bunch",
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
            game.animationEnded = true;
        });
    }
    function sendComputerMove() {
        if (!game.isComputerTurn) {
            return;
        }
        game.isComputerTurn = false; // to make sure the computer can only move once.
        moveService.makeMove(aiService.findComputerMove(game.move));
    }
    function updateUI(params) {
        log.info("Game got updateUI:", params);
        game.animationEnded = false;
        game.move = params.move;
        game.state = game.move.stateAfterMove;
        if (!game.state) {
            game.state = gameLogic.getInitialState();
            game.move.endMatchScores = [0, 0];
            game.move.turnIndexAfterMove = 0;
            game.move.stateAfterMove = game.state;
        }
        resetBoard(game.state.scores);
        game.canMakeMove = game.move.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === game.move.turnIndexAfterMove; // it's my turn
        game.deckIndex = game.canMakeMove ? game.state.round - 1 : game.deckIndex;
        if (game.move.turnIndexAfterMove < 0) {
            $interval.cancel(timer);
        }
        // Is it the computer's turn?
        game.isComputerTurn = game.canMakeMove &&
            params.playersInfo[params.yourPlayerIndex].playerId === '';
        if (game.isComputerTurn) {
            // To make sure the player won't click something and send a move instead of the computer sending a move.
            game.canMakeMove = false;
            sendComputerMove();
        }
    }
    function gameIsOver() {
        return game.move.turnIndexAfterMove < 0;
    }
    game.gameIsOver = gameIsOver;
    function isWinner(playerIndex) {
        if (!gameIsOver()) {
            return false;
        }
        if (playerIndex == 0) {
            return game.player1Score == game.player2Score;
        }
        if (playerIndex == 1) {
            return game.player1Score > game.player2Score;
        }
        if (playerIndex == 2) {
            return game.player1Score < game.player2Score;
        }
        return false;
    }
    game.isWinner = isWinner;
    function cardClicked(cardIndex) {
        if (game.state && game.state.bunches.length % 2 == 1) {
            var lastBunchIndex = game.state.bunches.length - 1;
            var lastBunch = game.state.bunches[lastBunchIndex];
            if (lastBunch.seconds <= game.seconds && lastBunch.cardIndices.indexOf(cardIndex) !== -1) {
                return;
            }
        }
        var index = game.cards.indexOf(cardIndex);
        if (index == -1) {
            game.cards.push(cardIndex);
        }
        else {
            game.cards.splice(index, 1);
        }
        if (game.cards.length >= 3) {
            game.cardsPlayed = game.cards;
            submitMove();
        }
        else {
            game.cardsPlayed = [];
        }
    }
    game.cardClicked = cardClicked;
    function isCurrentPlayerIndex(playerIndex) {
        return game.move.turnIndexAfterMove == playerIndex;
    }
    game.isCurrentPlayerIndex = isCurrentPlayerIndex;
    function startClicked() {
        if (gameIsOver() || !game.canMakeMove) {
            return;
        }
        game.roundStarted = true;
        game.showResults = false;
        game.cardsPlayed = [];
        timer = $interval(function () {
            game.seconds++;
        }, 1000);
    }
    game.startClicked = startClicked;
    function resetBoard(scores) {
        $interval.cancel(timer);
        game.roundStarted = false;
        game.cards = [];
        game.seconds = 0;
        game.player1Score = scores[0];
        game.player2Score = scores[1];
    }
    function passMove() {
        if (game.canMakeMove) {
            game.cards = [];
            submitMove();
        }
    }
    game.passMove = passMove;
    function submitMove() {
        if (window.location.search === '?throwException') {
            throw new Error("Throwing the error because URL has '?throwException'");
        }
        if (!game.canMakeMove) {
            return;
        }
        try {
            var nextMove = gameLogic.createMove(game.state, game.cards, game.seconds, game.move.turnIndexAfterMove, game.state.round, game.state.scores);
            game.canMakeMove = false; // to prevent making another move
            moveService.makeMove(nextMove);
        }
        catch (e) {
            log.info(["Invalid cards:", game.cards]);
            game.cards = [];
            return;
        }
    }
    game.submitMove = submitMove;
    function getEmoji(index) {
        return game.state.decks[game.deckIndex][index][0];
    }
    game.getEmoji = getEmoji;
    function getEmojiCount(index) {
        return parseInt(game.state.decks[game.deckIndex][index][1]);
    }
    game.getEmojiCount = getEmojiCount;
    function isBlue(index) {
        return game.state.decks[game.deckIndex][index][2] == "blue";
    }
    game.isBlue = isBlue;
    function isPink(index) {
        return game.state.decks[game.deckIndex][index][2] == "pink";
    }
    game.isPink = isPink;
    function isOrange(index) {
        return game.state.decks[game.deckIndex][index][2] == "orange";
    }
    game.isOrange = isOrange;
    function isSolid(index) {
        return game.state.decks[game.deckIndex][index][3] == "solid";
    }
    game.isSolid = isSolid;
    function isDotted(index) {
        return game.state.decks[game.deckIndex][index][3] == "dotted";
    }
    game.isDotted = isDotted;
    function isDouble(index) {
        return game.state.decks[game.deckIndex][index][3] == "double";
    }
    game.isDouble = isDouble;
    function shouldFlip(index) {
        if (game.state && game.state.bunches.length % 2 == 1) {
            var lastBunchIndex = game.state.bunches.length - 1;
            var lastBunch = game.state.bunches[lastBunchIndex];
            if (lastBunch.seconds <= game.seconds && lastBunch.cardIndices.indexOf(index) !== -1) {
                if (game.cards.indexOf(index) !== -1) {
                    game.cards.splice(game.cards.indexOf(index), 1);
                }
                return true;
            }
        }
        return false;
    }
    game.shouldFlip = shouldFlip;
    function alreadyPlayedCard(index) {
        if (game.state && game.state.bunches.length % 2 == 1) {
            var lastBunchIndex = game.state.bunches.length - 1;
            var lastBunch = game.state.bunches[lastBunchIndex];
            return lastBunch.cardIndices.indexOf(index) !== -1;
        }
        return false;
    }
    function shouldHintCardIndex(index) {
        if (gameIsOver()) {
            return false;
        }
        if (game.seconds !== 20 && game.seconds !== 30 && game.seconds !== 35) {
            return false;
        }
        var deck = game.state.decks[game.state.round - 1];
        var possibleMoves = aiService.getPossibleMoves(game.state, game.move.turnIndexAfterMove);
        var validMoveExists = false;
        for (var i = 0; i < possibleMoves.length; i++) {
            var possibleMove = possibleMoves[i];
            var bunches = possibleMove.stateAfterMove.bunches;
            var lastBunch = bunches[bunches.length - 1];
            var alreadyPlayed = false;
            for (var y = 0; y < lastBunch.cardIndices.length; y++) {
                alreadyPlayed = alreadyPlayedCard(lastBunch.cardIndices[y]);
                if (alreadyPlayed) {
                    break;
                }
            }
            if (alreadyPlayed) {
                continue;
            }
            validMoveExists = true;
            if (game.seconds == 20) {
                return lastBunch.cardIndices[0] == index;
            }
            else if (game.seconds == 30) {
                return lastBunch.cardIndices[1] == index;
            }
        }
        return -1 == index && game.seconds > 30 && !validMoveExists;
    }
    game.shouldHintCardIndex = shouldHintCardIndex;
    function shouldShakeCard(index) {
        if (game.cardsPlayed.indexOf(index) !== -1) {
            var borders = [];
            for (var i = 0; i < 3; i++) {
                var cardPlayed = game.cardsPlayed[i];
                var border = game.state.decks[game.state.round - 1][cardPlayed][3];
                if (borders.indexOf(border) === -1) {
                    borders.push(border);
                }
            }
            return borders.length !== 1 && borders.length !== 3;
        }
        return false;
    }
    game.shouldShakeCard = shouldShakeCard;
    function shouldBounceEmoji(index) {
        if (game.cardsPlayed.indexOf(index) !== -1) {
            var emojis = [];
            var counts = [];
            var colors = [];
            for (var i = 0; i < 3; i++) {
                var cardPlayed = game.cardsPlayed[i];
                var emoji = game.state.decks[game.state.round - 1][cardPlayed][0];
                var count = game.state.decks[game.state.round - 1][cardPlayed][1];
                var color = game.state.decks[game.state.round - 1][cardPlayed][2];
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
    game.shouldBounceEmoji = shouldBounceEmoji;
    function resultRoundClicked(round) {
        if (game.resultRound == round) {
            game.showResults = !game.showResults;
        }
        game.resultRound = round;
    }
    game.resultRoundClicked = resultRoundClicked;
    function resultIsBlue(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][2] == "blue";
    }
    game.resultIsBlue = resultIsBlue;
    function resultIsPink(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][2] == "pink";
    }
    game.resultIsPink = resultIsPink;
    function resultIsOrange(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][2] == "orange";
    }
    game.resultIsOrange = resultIsOrange;
    function resultIsSolid(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][3] == "solid";
    }
    game.resultIsSolid = resultIsSolid;
    function resultIsDotted(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][3] == "dotted";
    }
    game.resultIsDotted = resultIsDotted;
    function resultIsDouble(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return false;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return false;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][3] == "double";
    }
    game.resultIsDouble = resultIsDouble;
    function getResultEmoji(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return "";
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return "";
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return game.state.decks[roundIndex][index][0];
    }
    game.getResultEmoji = getResultEmoji;
    function getResultEmojiCount(playerIndex, cardIndex) {
        var roundIndex = game.resultRound - 1;
        if (roundIndex % 2 == 1) {
            playerIndex = 1 - playerIndex;
        }
        if (game.state.bunches.length <= roundIndex * 2 + playerIndex) {
            return 0;
        }
        if (game.state.bunches[roundIndex * 2 + playerIndex].cardIndices.length == 0) {
            return 0;
        }
        var index = game.state.bunches[roundIndex * 2 + playerIndex].cardIndices[cardIndex];
        return parseInt(game.state.decks[roundIndex][index][1]);
    }
    game.getResultEmojiCount = getResultEmojiCount;
    function clickedOnModal(evt) {
        if (evt.target === evt.currentTarget) {
            evt.preventDefault();
            evt.stopPropagation();
            game.isHelpModalShown = false;
        }
        return true;
    }
    game.clickedOnModal = clickedOnModal;
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    game.init();
});
//# sourceMappingURL=game.js.map
;
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
                        if (state.bunches.length % 2 == 1 && state.bunches[state.bunches.length - 1].cardIndices.sort(function (a, b) { return a - b; }) == [i, j, k].sort(function (a, b) { return a - b; })) {
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