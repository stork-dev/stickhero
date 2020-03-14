let game;
let gameOptions = {
    platformGapRange: [200, 400],
    platformWidthRange: [50, 150],
    platformHeight: 600,
    playerWidth: 32,
    playerHeight: 64,
    poleWidth: 8,
    growTime: 500,
    rotateTime: 500,
    walkTime: 500,
    fallTime: 500,
    scrollTime: 250
}
const IDLE = 0;
const WAITING = 1;
const GROWING = 2;
window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        width: 750,
        height: 1334,
        scene: [playGame],
        backgroundColor: 0x0c88c7
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image("tile", "tile.png");
    }
    create(){
        this.addPlatforms();
        this.addPlayer();
        this.addPole();
        this.input.on("pointerdown", this.grow, this);
        this.input.on("pointerup", this.stop, this);
    }
    addPlatforms(){
        this.mainPlatform = 0;
        this.platforms = [];
        this.platforms.push(this.addPlatform(0));
        this.platforms.push(this.addPlatform(game.config.width));
        this.tweenPlatform();
    }
    addPlatform(posX){
        let platform = this.add.sprite(posX, game.config.height - gameOptions.platformHeight, "tile");
        platform.displayWidth = (gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]) / 2;
        platform.displayHeight = gameOptions.platformHeight;
        platform.alpha = 0.7;
        platform.setOrigin(0, 0);
        return platform
    }
    tweenPlatform(){
        let destination = this.platforms[this.mainPlatform].displayWidth + Phaser.Math.Between(gameOptions.platformGapRange[0], gameOptions.platformGapRange[1]);
        let size = Phaser.Math.Between(gameOptions.platformWidthRange[0], gameOptions.platformWidthRange[1]);
        this.tweens.add({
            targets: [this.platforms[1 - this.mainPlatform]],
            x: destination,
            displayWidth: size,
            duration: gameOptions.scrollTime,
            callbackScope: this,
            onComplete: function(){
                this.gameMode = WAITING;
            }
        })
    }
    addPlayer(){
        this.player = this.add.sprite(this.platforms[this.mainPlatform].displayWidth - gameOptions.poleWidth, game.config.height - gameOptions.platformHeight, "tile");
        this.player.displayWidth = gameOptions.playerWidth;
        this.player.displayHeight = gameOptions.playerHeight;
        this.player.setOrigin(1, 1)
    }
    addPole(){
        this.pole = this.add.sprite(this.platforms[this.mainPlatform].displayWidth, game.config.height - gameOptions.platformHeight, "tile");
        this.pole.setOrigin(1, 1);
        this.pole.displayWidth = gameOptions.poleWidth;
        this.pole.displayHeight = gameOptions.playerHeight / 4;
    }
    grow(){
        if(this.gameMode == WAITING){
            this.gameMode = GROWING;
            this.growTween = this.tweens.add({
                targets: [this.pole],
                displayHeight: gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1],
                duration: gameOptions.growTime
            });
        }
    }
    stop(){
        if(this.gameMode == GROWING){
            this.gameMode = IDLE;
            this.growTween.stop();
            if(this.pole.displayHeight > this.platforms[1 - this.mainPlatform].x - this.pole.x){
                this.tweens.add({
                    targets: [this.pole],
                    angle: 90,
                    duration: gameOptions.rotateTime,
                    ease: "Bounce.easeOut",
                    callbackScope: this,
                    onComplete: function(){
                        if(this.pole.displayHeight < this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.x){
                            this.tweens.add({
                                targets: [this.player],
                                x: this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.displayWidth,
                                duration: gameOptions.walkTime,
                                callbackScope: this,
                                onComplete: function(){
                                    this.tweens.add({
                                        targets: [this.player, this.pole, this.platforms[1 - this.mainPlatform], this.platforms[this.mainPlatform]],
                                        props: {
                                            x: {
                                                value: "-= " +  this.platforms[1 - this.mainPlatform].x
                                            }
                                        },
                                        duration: gameOptions.scrollTime,
                                        callbackScope: this,
                                        onComplete: function(){
                                            this.prepareNextMove();
                                        }
                                    })
                                }
                            })
                        }
                        else{
                            this.platformTooLong();
                        }
                    }
                })
            }
            else{
                this.platformTooShort();
            }
        }
    }
    platformTooLong(){
        this.tweens.add({
            targets: [this.player],
            x: this.pole.x + this.pole.displayHeight + this.player.displayWidth,
            duration: gameOptions.walkTime,
            callbackScope: this,
            onComplete: function(){
                this.fallAndDie();
            }
        })
    }
    platformTooShort(){
        this.tweens.add({
            targets: [this.pole],
            angle: 90,
            duration: gameOptions.rotateTime,
            ease: "Cubic.easeIn",
            callbackScope: this,
            onComplete: function(){
                this.tweens.add({
                    targets: [this.player],
                    x: this.pole.x + this.pole.displayHeight,
                    duration: gameOptions.walkTime,
                    callbackScope: this,
                    onComplete: function(){
                        this.tweens.add({
                            targets: [this.pole],
                            angle: 180,
                            duration: gameOptions.rotateTime,
                            ease: "Cubic.easeIn"
                        })
                        this.fallAndDie();
                    }
                })
            }
        })
    }
    fallAndDie(){
        this.tweens.add({
            targets: [this.player],
            y: game.config.height + this.player.displayHeight * 2,
            duration: gameOptions.fallTime,
            ease: "Cubic.easeIn",
            callbackScope: this,
            onComplete: function(){
                this.cameras.main.shake(800, 0.01);
                this.time.addEvent({
                    delay: 2000,
                    callbackScope: this,
                    callback: function(){
                        this.scene.start("PlayGame");
                    }
                })
            }
        })
    }
    prepareNextMove(){
        this.platforms[this.mainPlatform].x = game.config.width;
        this.mainPlatform = 1 - this.mainPlatform;
        this.tweenPlatform();
        this.pole.angle = 0;
        this.pole.x = this.platforms[this.mainPlatform].displayWidth;
        this.pole.displayHeight = gameOptions.poleWidth;
    }
};
function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
