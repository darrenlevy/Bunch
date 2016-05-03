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