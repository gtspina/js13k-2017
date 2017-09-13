"use strict";

var assetsToLoad = [
    { src: "./audio/coin.mp3", name: "coin" },
    { src: "./audio/game_over.mp3", name: "game_over" }
];
var loadedAssets = assetsToLoad.length;
var sounds = {};

var prevTime = new Date().getTime();
var seconds = 0;
var currState;
var totalScore = 0;

var TypeTile = {
    "Empty": "0",
    "Player": "P",
    "Block": "B",
    "Enemy": "E",
    "Door": "D",
    "Coin": "C"
};

var TileTypeInfo = [
    { type: TypeTile.Block, color: "#399B6E", width: 25, height: 25 },
    { type: TypeTile.Enemy, color: "red", width: 25, height: 25 },
    { type: TypeTile.Door, color: "#FFF", width: 25, height: 25 },
    { type: TypeTile.Coin, color: "yellow", width: 25, height: 25 },
    { type: TypeTile.Player, color: "#FFF", width: 25, height: 25 }
];

var GameState = {
    Menu: "Menu",
    InGame: "InGame",
    Constructor: "Constructor"
};

var player = {
    x: 0,
    y: 200,
    initialPosX: 0,
    initialPosY: 200,
    velX: 0,
    velY: 0,
    width: 25,
    height: 25
};
var defaultVel = 4;
var coinsCollected = 0;

var currMapItems = [];
var currentMap = 0;

var grid = [];
var inEdition = false;
var selectedPos = { x: -1, y: -1 };
var selectedndexTile = 0;
var selectedTypeTile = "0";

var GameUtil = {};

GameUtil.hasRectCollision = function (obj1, obj2) {
    var maxX = obj1.x + obj1.width > obj2.x;
    var maxY = obj1.y + obj1.height > obj2.y;
    var minX = obj1.x < obj2.x + obj2.width;
    var minY = obj1.y < obj2.y + obj2.height;

    return maxX && minX && maxY && minY;
};

GameUtil.getInserction = function (obj1, obj2) {
    var yTop = obj1.y - obj2.y - obj2.height;
    var yBottom = obj1.y - obj2.y + obj1.height;
    var xLeft = obj1.x - obj2.x - obj2.width;
    var xRight = obj1.x - obj2.x + obj1.width;

    return {
        yTop: yTop,
        yBottom: yBottom,
        xLeft: xLeft,
        xRight: xRight
    };
};

GameUtil.getType = function (type) {
    var type = TileTypeInfo.find(function (typeInfo) {
        if (typeInfo.type == type) {
            return true;
        }
    });

    if (!type) {
        throw "Invalid Type";
    }

    return type;
};

GameUtil.createTile = function (type, posX, posY, width, height, color) {
    return {
        type: type,
        x: posX,
        y: posY,
        width: width,
        height: height,
        color: color
    };
};

GameUtil.generateMapCode = function () {
    var w = 800;
    var h = 600;

    var t = [];

    for (var currH = 0; currH < h; currH += 25) {
        var currLine = [];

        for (var currW = 0; currW < w; currW += 25) {

            var matchTileIndex = currMapItems.findIndex(function (item) {
                if (item.x == currW && item.y == currH) {
                    return true;
                }
            });

            if (matchTileIndex > -1) {
                currLine.push(currMapItems[matchTileIndex].type);
            } else {
                currLine.push("0");
            }
        }

        t.push(currLine);
    }

    var playerX = Math.floor(player.x / 25);
    var playerY = Math.floor(player.y / 25);

    t[playerY][playerX] = TypeTile.Player;

    var t2 = "";

    t.forEach(function (elem) {
        var line = elem.join("|");

        t2 += line + "%";
    });

    document.getElementById("code").value = t2;
};

GameUtil.lodMapCode = function (val) {
    currMapItems = [];

    var lines = val.split("%");

    lines.forEach(function (line, indexLine) {
        var items = line.split("|");

        if (items) {
            items.forEach(function (item, indexCol) {
                var x = indexCol * 25;
                var y = indexLine * 25;

                if (item && item != TypeTile.Empty && item != TypeTile.Player) {
                    var typeInfo = GameUtil.getType(item);
                    var tile = GameUtil.createTile(typeInfo.type, x, y, typeInfo.width, typeInfo.height, typeInfo.color);

                    currMapItems.push(tile);
                } else if (item == TypeTile.Player) {
                    player.velX = 0;
                    player.velY = 0;

                    player.x = x;
                    player.y = y;
                    player.initialPosX = x;
                    player.initialPosY = y;
                }
            });
        }
    });
};

GameUtil.sendAlertToUser = function (msg) {
    var modal = document.getElementById('myModal');
    var modalContent = document.getElementById('modalContent');

    modal.style.display = "block";
    modalContent.innerHTML = msg;
};

var Game = {};
var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

Game.loadAssets = function () {
    assetsToLoad.forEach(function (assetInfo) {
        var currAudio = new Audio();

        currAudio.src = assetInfo.src;
        currAudio.onloadeddata = function () {
            loadedAssets -= 1;

            sounds[assetInfo.name] = currAudio;
            console.log("Loaded: ", assetInfo.name);
        };
    });

    Game.waitAssets();
};

Game.waitAssets = function () {
    if (loadedAssets > 0) {

        setTimeout(function () {
            Game.loadAssets();
        }, 1000);

    } else {
        console.log("Loaded all assets");
        Game.init();
    }
};

Game.init = function () {
    Keyboard.init();
    Mouse.init("myCanvas");

    currState = GameState.Menu;

    GameUtil.lodMapCode(newMaps[0]);

    createGrid();
    setEditor();
    setModal();

    Game.mainLoop(1);

    function createGrid() {
        var w = 800;
        var h = 600;

        for (var currW = 0; currW < w; currW += 25) {
            for (var currH = 0; currH < h; currH += 25) {

                grid.push({
                    x: currW,
                    y: currH,
                    color: "white",
                    width: 25,
                    height: 25
                });
            }
        }
    }

    function getType(type) {
        var type = TileTypeInfo.find(function (typeInfo) {
            if (typeInfo.type == type) {
                return true;
            }
        });

        if (!type) {
            throw "Invalid Type";
        }

        return type;
    }

    function createTile(type, posX, posY, width, height, color) {
        return {
            type: type,
            x: posX,
            y: posY,
            width: width,
            height: height,
            color: color
        };
    };

    function setEditor() {
        var editorEntries = document.getElementsByClassName("EditorEntrie");

        for (var i = 0; i < editorEntries.length; i++) {
            var entrie = editorEntries[i];

            entrie.addEventListener("click", function (event) {
                if (currState != GameState.Constructor) {
                    GameUtil.sendAlertToUser("Button only works in the constructor mode");
                } else {
                    var type = this.getAttribute("data-id");
                    selectedTypeTile = type;
                }
            });
        }

        var setterVel = document.getElementById("setterVel");
        var showVel = document.getElementById("showVel");

        /*showVel.innerText = setterVel.value;

        setterVel.addEventListener("change", function (event) {
            showVel.innerText = this.value;
            defaultVel = this.value;
        });*/

        var btnGenerateMap = document.getElementById("btnGenerateMap");

        btnGenerateMap.addEventListener("click", function () {
            if (currState != GameState.Constructor) {
                GameUtil.sendAlertToUser("Button only works in the constructor mode");
            } else {
                GameUtil.generateMapCode();
            }
        });

        var btnLoadMap = document.getElementById("btnLoadMap");

        btnLoadMap.addEventListener("click", function () {
            if (currState != GameState.Constructor) {
                GameUtil.sendAlertToUser("Button only works in the constructor mode");
            } else {
                var code = document.getElementById("code");
                var val = code.value.trim();

                GameUtil.lodMapCode(val);
            }
        });
    }

    function setModal() {
        var modal = document.getElementById('myModal');

        var span = document.getElementsByClassName("close")[0];

        span.onclick = function () {
            modal.style.display = "none";
        }

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }
};

Game.mainLoop = function (time) {
    Game.update(time);
    Game.draw();

    requestAnimationFrame(function (time) {
        Game.mainLoop(time);
    });
};

Game.update = function (time) {
    var colMouse = {
        x: Mouse.pos.x,
        y: Mouse.pos.y,
        width: 1,
        height: 1
    };

    switch (currState) {
        case GameState.Menu:
            updateMenu();
            break;
        case GameState.InGame:
        case GameState.Constructor:
            updateGame();
            break;
    }

    Mouse.reset();
    Keyboard.reset();

    function updateGame() {
        var goToMenuCol = { x: 0, y: 0, width: 300, height: 50 };

        if (GameUtil.hasRectCollision(goToMenuCol, colMouse) && Mouse.leftDown) {
            currState = GameState.Menu;
        }

        if (time) {
            seconds += ((time - prevTime) / 1000);
        }

        if (currState == GameState.Constructor && inEdition) {
            seconds = 0;
        }

        var dt = (time - prevTime) / 1000;
        prevTime = time;
        var vel = parseInt(defaultVel);

        if (currState == GameState.Constructor && Keyboard.spaceClicked) {
            inEdition = !inEdition;
        }

        if (Keyboard.rightPressed) {
            player.velX = vel;
            player.velY = 0;
        }

        if (Keyboard.leftPressed) {
            player.velX = -vel;
            player.velY = 0;
        }

        if (Keyboard.downPressed) {
            player.velY = vel;
            player.velX = 0;
        }

        if (Keyboard.upPressed) {
            player.velY = -vel;
            player.velX = 0;
        }

        player.x += player.velX;
        player.y += player.velY;

        var topCollider = {
            x: player.x,
            y: player.y,
            width: player.width,
            height: 1
        };

        var bottomCollider = {
            x: player.x,
            y: player.y + player.height - 1,
            width: player.width,
            height: 1
        };

        var leftCollider = {
            x: player.x - 4,
            y: player.y,
            width: 1,
            height: player.height
        };

        var rightCollider = {
            x: player.x + player.width - 1,
            y: player.y,
            width: 1,
            height: player.height
        };

        var topCol = hasCollision(topCollider, TypeTile.Block);
        var bottomCol = hasCollision(bottomCollider, TypeTile.Block);
        var leftCol = hasCollision(leftCollider, TypeTile.Block);
        var rightCol = hasCollision(rightCollider, TypeTile.Block);

        if (topCol && player.velY != 0) {
            var difference = GameUtil.getInserction(player, topCol);
            player.y -= difference.yTop;
            player.velY = 0;
        }

        if (bottomCol && player.velY != 0) {
            var difference = GameUtil.getInserction(player, bottomCol);
            player.y -= difference.yBottom;
            player.velY = 0;
        }

        if (leftCol && player.velX != 0) {
            var difference = GameUtil.getInserction(player, leftCol);
            player.x -= difference.xLeft;
            player.velX = 0;
        }

        if (rightCol && player.velX != 0) {
            var difference = GameUtil.getInserction(player, rightCol);
            player.x -= difference.xRight;
            player.velX = 0;
        }

        var coinCol = hasCollision(player, TypeTile.Coin);

        if (coinCol) {
            var indexCoin = currMapItems.findIndex(function (item) {
                if (item.x == coinCol.x && item.y == coinCol.y && coinCol.type == TypeTile.Coin) {
                    return true;
                }
            });

            if (indexCoin > -1) {
                currMapItems.splice(indexCoin, 1);
                coinsCollected += 10;
                sounds["coin"].play();
            }
        }

        var enemyCol = hasCollision(player, TypeTile.Enemy);

        if (enemyCol) {
            sounds["game_over"].play();
            player.velX = 0;
            player.velY = 0;
            player.x = player.initialPosX;
            player.y = player.initialPosY;
        }

        var doorCol = hasCollision(player, TypeTile.Door);

        if (doorCol) {
            GameUtil.sendAlertToUser("You Win!");

            if (currState == GameState.InGame) {
                currentMap = (currentMap + 1) % newMaps.length;

                if (coinsCollected > 0) {
                    var newScore = Math.floor(coinsCollected - (seconds * 0.2));

                    if (newScore > 0) {
                        totalScore += newScore;
                    }
                }
                GameUtil.lodMapCode(newMaps[currentMap]);
            }

            seconds = 0;
            player.velX = 0;
            player.velY = 0;
            player.x = player.initialPosX;
            player.y = player.initialPosY;
            coinsCollected = 0;
        }

        if (currState == GameState.Constructor && inEdition) {
            var editorPosX = Math.floor(Mouse.pos.x / 25) * 25;
            var editorPosY = Math.floor(Mouse.pos.y / 25) * 25;

            var matchTileIndex = currMapItems.findIndex(function (item) {
                if (item.x == editorPosX && item.y == editorPosY) {
                    return true;
                }
            });

            if (editorPosX != selectedPos.x || editorPosY != selectedPos.y) {
                selectedndexTile = 0;
            }

            var tilesTypes = [TypeTile.Block, TypeTile.Enemy, TypeTile.Door, TypeTile.Player];
            var insideCanvas = Mouse.pos.x < 800 && Mouse.pos.y < 600;

            if (Mouse.leftDown && insideCanvas) {
                if (matchTileIndex > -1) {
                    currMapItems.splice(matchTileIndex, 1);
                }

                if (selectedTypeTile != "0" && selectedTypeTile != TypeTile.Player) {
                    var typeInfo = GameUtil.getType(selectedTypeTile);
                    currMapItems.push(GameUtil.createTile(typeInfo.type, editorPosX, editorPosY, 25, 25, typeInfo.color));
                }
                if (selectedTypeTile == TypeTile.Player) {
                    player.x = editorPosX;
                    player.y = editorPosY;
                    player.initialPosX = editorPosX;
                    player.initialPosY = editorPosY;

                    player.velX = 0;
                    player.velY = 0;
                }
            }

            selectedPos.x = editorPosX;
            selectedPos.y = editorPosY;
        }
    }

    function updateMenu() {
        var colMenuInitGame = {
            x: 300,
            y: 240,
            width: 200,
            height: 80
        };

        var colMenuConstruct = {
            x: 200,
            y: 340,
            width: 400,
            height: 80
        };

        var colAbout = {
            x: 690,
            y: 520,
            width: 400,
            height: 40
        }

        if (Mouse.leftClick && GameUtil.hasRectCollision(colMenuInitGame, colMouse)) {
            prevTime = time;
            seconds = 0;
            GameUtil.lodMapCode(newMaps[currentMap]);
            currState = GameState.InGame;
        }

        if (Mouse.leftClick && GameUtil.hasRectCollision(colMenuConstruct, colMouse)) {
            if (totalScore < 20) {
                GameUtil.sendAlertToUser("Get 20 points to unlock this function");
            } else {
                prevTime = time;
                seconds = 0;
                GameUtil.lodMapCode("");
                currState = GameState.Constructor;
            }
        }

        if (Mouse.leftClick && GameUtil.hasRectCollision(colAbout, colMouse)) {
            var msgAbout = "Developers: <br> \
            Audio Design: Aly Baddauhy Neto <br> \
            Game Design: Ricardo Cruz <br> \
            Programming: Gabriel T. Spina, Henrique Papile";

            GameUtil.sendAlertToUser(msgAbout);
        }
    }

    function hasCollision(col, type) {
        var collision = currMapItems.find(function (item) {
            if (GameUtil.hasRectCollision(col, item) && item.type == type) {
                return true;
            }

            return false;
        });

        return collision;
    }
};

Game.draw = function () {
    context.clearRect(0, 0, 500, 500);

    Printer.drawRect(context, 0, 0, 800, 600, "black");

    switch (currState) {
        case GameState.Menu:
            printMenu();
            break;
        case GameState.Constructor:
        case GameState.InGame:
            printGame();
            break;
    }

    function printGame() {
        currMapItems.forEach(function (item) {
            Printer.drawRect(context, item.x, item.y, item.width, item.height, item.color);
        });

        if (inEdition && currState == GameState.Constructor) {
            grid.forEach(function (item) {
                Printer.drawBorderRect(context, item.x, item.y, item.width, item.height, item.color);
            });

            var editorPosX = Math.floor(Mouse.pos.x / 25) * 25;
            var editorPosY = Math.floor(Mouse.pos.y / 25) * 25;

            if (selectedTypeTile != "0") {
                var typeInfo = GameUtil.getType(selectedTypeTile);
                Printer.drawRect(context, editorPosX, editorPosY, typeInfo.width, typeInfo.height, typeInfo.color, 0.5);
            } else {
                Printer.drawText(context, "X", editorPosX + 6, editorPosY + 20, "20px arial", "darkred");
            }
        }

        var countDownMinutes = Math.floor(seconds / 60);
        var countDownSeconds = Math.floor(seconds % 60);

        if (countDownSeconds < 10) {
            countDownSeconds = "0" + countDownSeconds;
        }

        Printer.drawText(context, "Coins: " + coinsCollected, 100, 550, "40px arial", "white");
        Printer.drawText(context, "Total Score: " + totalScore, 300, 550, "40px arial", "white");

        Printer.drawText(context, countDownMinutes + ":" + countDownSeconds, 600, 550, "40px arial", "white");
        Printer.drawRect(context, player.x, player.y, player.width, player.height, "white");

        //Printer.drawRect(context, 0, 0, 300, 50, "yellow");
        Printer.drawText(context, "Return to Menu", 10, 40, "40px arial", "white");
    }

    function printMenu() {
        Printer.drawText(context, "THE GAME", 140, 100, "100px arial", "white");

        //Printer.drawRect(context, 300, 240, 200, 80, "white");
        Printer.drawText(context, "START", 300, 300, "60px arial", "white");
        //Printer.drawRect(context, 200, 340, 400, 80, "yellow");

        var colorConstruct = "grey";

        if (totalScore >= 20) {
            colorConstruct = "white";
        }

        Printer.drawText(context, "CONSTRUCT", 210, 400, "60px arial", colorConstruct);

        Printer.drawText(context, "Total Score: " + totalScore, 300, 550, "40px arial", "white");

        //Printer.drawRect(context, 690, 520, 400, 40, "yellow");
        Printer.drawText(context, "ABOUT", 700, 550, "20px arial", "white");
    }
};

Game.loadAssets();