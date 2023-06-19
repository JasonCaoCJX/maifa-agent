import * as EasyStar from 'easystarjs';

import { Game } from "./index";
import { Direction } from "./Direction";

interface PlayerInfo {
    uid: string,
    name: string,
    avatar: number,
}

const Vector2 = Phaser.Math.Vector2;
type Vector2 = Phaser.Math.Vector2;

export class Player {
    private container!: Phaser.GameObjects.Container
    private bubbleList!: Phaser.GameObjects.Container

    private sprite!: Phaser.GameObjects.Sprite
    private spriteName: string = ""
    private nameLabel!: Phaser.GameObjects.Text
    

    private playerInfo: PlayerInfo
    private tilePos: Phaser.Math.Vector2

    private easystar: EasyStar.js = new EasyStar.js();


    private load!: Phaser.Loader.LoaderPlugin
    private add!: Phaser.GameObjects.GameObjectFactory
    private tweens!: Phaser.Tweens.TweenManager
    private tileMap!: Phaser.Tilemaps.Tilemap
    private anims!: Phaser.Animations.AnimationManager

    // 移动方向向量映射
    private movementDirectionVectors: { [key in Direction]?: Vector2; } = {
        [Direction.UP]: Vector2.UP,        // (x = 0, y = -1)
        [Direction.DOWN]: Vector2.DOWN,    // (x = 0, y = 1)
        [Direction.LEFT]: Vector2.LEFT,    // (x = -1, y = 0)
        [Direction.RIGHT]: Vector2.RIGHT,  // (x = 1, y = 0)
        [Direction.RIGHT_UP]: new Phaser.Math.Vector2(1, -1),
        [Direction.RIGHT_DOWN]: new Phaser.Math.Vector2(1, 1),
        [Direction.LEFT_UP]: new Phaser.Math.Vector2(-1, -1),
        [Direction.LEFT_DOWN]: new Phaser.Math.Vector2(-1, 1),
    };
   

    constructor(playerInfo: PlayerInfo, tilePos: Phaser.Math.Vector2) {
        this.playerInfo = playerInfo,
        this.tilePos = tilePos
    }

    async preload(load: Phaser.Loader.LoaderPlugin) {
        this.load = load
        this.spriteName = `sprite${this.playerInfo.avatar}`
        const sprite_path = `../assets/sprites/${this.spriteName}.png`;
        
        this.load.spritesheet(this.spriteName, sprite_path, {
            frameWidth: 52,
            frameHeight: 72,
        });
    }

    create(add: Phaser.GameObjects.GameObjectFactory, tweens: Phaser.Tweens.TweenManager, anims: Phaser.Animations.AnimationManager,  tileMap: Phaser.Tilemaps.Tilemap) {
        this.add = add
        this.tweens = tweens
        this.anims = anims
        this.tileMap = tileMap

        // 创建形象
        this.sprite = this.add.sprite(0, 0, this.spriteName);
        this.sprite.scale = Game.SCALE / 2;
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setPosition(0, 0);
        this.sprite.setFrame(1);

        // 创建动作
        this.createPlayerAnimation(`${this.spriteName}_${Direction.UP}`, 9, 11);
        this.createPlayerAnimation(`${this.spriteName}_${Direction.RIGHT}`, 6, 8);
        this.createPlayerAnimation(`${this.spriteName}_${Direction.DOWN}`, 0, 2);
        this.createPlayerAnimation(`${this.spriteName}_${Direction.LEFT}`, 3, 5);
        
        // 创建名牌
        this.nameLabel = this.add.text(0, 0, this.playerInfo.name, {fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 4});
        this.nameLabel.setOrigin(0.5);
        this.nameLabel.setPosition(0, -80);

        // 绑定所有人物相关信息
        this.container = this.add.container(0, 0, [ this.sprite, this.nameLabel ]);
        this.container.setDepth(3);

        // 创建消息框
        this.bubbleList = this.add.container(0, 0, []);
        
        this.bornOnMap()
        this.createEasyStarGrid()

        // setTimeout(() => {
        //     this.autoMoving(15,13)
        //     this.sayWords('Hello, World!Hello', 5000)
        // }, 2000)
    }

    bornOnMap() {
        // x，y偏移量，让角色的脚与地块的底部重合
        const offsetX = Game.TILE_SIZE / 2;
        const offsetY = Game.TILE_SIZE;

        // 角色出生位置
        this.container.setPosition(
            this.tilePos.x * Game.TILE_SIZE + offsetX,
            this.tilePos.y * Game.TILE_SIZE + offsetY
        )

        // 检查地块属性
        this.checkArea()
    }

    sayWords(message: string, duration: number) {
        const padding = 10
        const bubbleWidth = 150

        // 创建气泡框
        var graphics = this.add.graphics();
 
        var text = this.add.text(padding, padding, message, {
            fontSize: '12px',
            color: '#000000',
            wordWrap: {
                width: 130,
                useAdvancedWrap: true
            }
        });

        let bottom = 0
        for (let i = 0; i < this.bubbleList.list.length; i++) {
            const b = this.bubbleList.list[i] as Phaser.GameObjects.Container
            bottom += b.getBounds().height + padding * 2 + 10
        }

        // 获取文本内容的高度
        const textHeight = text.getBounds().height
        const bubbleHieght = textHeight + padding * 2

        graphics.fillStyle(0xffffff, 1);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.fillRoundedRect(0, 0, bubbleWidth, bubbleHieght, 10);
        graphics.strokeRoundedRect(0, 0, bubbleWidth, bubbleHieght, 10);

 
        const bubble = this.add.container(0, 0, [ graphics, text ])
        // bubble.setOri
        bubble.setPosition(-(bubbleWidth / 2), -(100 + bubbleHieght + bottom))
        bubble.setAlpha(0)
        
        this.bubbleList.add(bubble)
        this.bubbleList.setPosition(this.getPosition().x, this.getPosition().y)
        this.bubbleList.setDepth(22)

        this.tweens.add({
            targets: bubble,
            alpha: 1,
            duration: 200,
            onComplete: () => {},
        })

        setTimeout(() => {
            this.tweens.add({
                targets: bubble,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.bubbleList.remove(bubble);
                    bubble.destroy();
                    
                    for (let i = 0; i < this.bubbleList.list.length; i++) {
                        const bubble = this.bubbleList.list[i] as Phaser.GameObjects.Container
                        let bottom = 0
                        for (let j = 0; j < i; j++) {
                            const b = this.bubbleList.list[j] as Phaser.GameObjects.Container
                            bottom += b.getBounds().height + padding * 2 + 10
                        }
                        bubble.setPosition(-(bubbleWidth / 2), -(100 + bubble.getBounds().height + padding * 2 + bottom))
                    }
                },
            })
        }, duration)
    }

    updateName(name: string) {
        this.nameLabel.setText(name)
    }

    autoMoving(x: number, y: number) {
        const startPoint = this.getTilePos();
        const endPoint = new Phaser.Math.Vector2(x, y);

        // console.log("起点", startPoint, "终点", endPoint)

        this.easystar.findPath(startPoint.x, startPoint.y, endPoint.x, endPoint.y, async(path: any[]) => {
            // 在这里处理寻路结果
            // console.log("找到路径:", path)
            if (path && path.length > 0) {
                let beforeDirection = Direction.NONE
                let currentDirection = Direction.NONE
                
                for (let i = 1; i < path.length; i++) {
                
                    const currentPoint = new Phaser.Math.Vector2(path[i - 1].x, path[i - 1].y);
                    const nextPoint = new Phaser.Math.Vector2(path[i].x, path[i].y);
                    const directionVector = nextPoint.clone().subtract(currentPoint);
                    const directionAngle = Phaser.Math.RadToDeg(directionVector.angle());
                    currentDirection = this.angleToDirection(directionAngle)
                    

                    if ((beforeDirection !== currentDirection)) {
                        // console.log("动作变化", currentDirection, beforeDirection)
                        this.startAnimation(currentDirection);
                    }
                    
                    await this.moveOneGrid(currentDirection);
                    beforeDirection = currentDirection
                }

                this.stopAnimation(currentDirection)
                this.resetToFront()
            } else {
                console.log("没有路径或不需要移动")
            }

        });
        this.easystar.calculate();
    }

    private moveOneGrid(direction: Direction) {
        return new Promise((resolve, reject) => {
            // 获取移动方向
            const directionVec = this.movementDirectionVectors[direction]!.clone();
            const newTilePos = this.getTilePos().add(directionVec)

            let speed = 180

            if (Math.abs(directionVec.x) + Math.abs(directionVec.y) == 2) {
                speed *= 1.4
            }

            const movementDistance = directionVec.multiply(new Vector2(Game.TILE_SIZE));
            const newPlayerPos = this.getPosition().add(movementDistance);

            this.checkArea()
            
            this.tweens.add({
                targets: this.bubbleList,
                duration: speed,
                x: newPlayerPos.x,
                y: newPlayerPos.y,
                onComplete: () => {}
            });
            this.tweens.add({
                targets: this.container,
                duration: speed,
                x: newPlayerPos.x,
                y: newPlayerPos.y,
                onComplete: () => {
                    // 更新用户位置
                    this.setPosition(newPlayerPos);
                    this.setTilePos(newTilePos)
                    resolve(true)
                }
            });

            
        })
    }

    // 角度转方向
    private angleToDirection(angle: number) {
        let direction: Direction = Direction.NONE;
        switch (angle) {
            case 0: direction = Direction.RIGHT; break;
            case 45: direction = Direction.RIGHT_DOWN; break;
            case 90: direction = Direction.DOWN; break;
            case 135: direction = Direction.LEFT_DOWN; break;
            case 180: direction = Direction.LEFT; break;
            case 225: direction = Direction.LEFT_UP; break;
            case 270: direction = Direction.UP; break;
            case 315: direction = Direction.RIGHT_UP; break;
            default: break;
        }
        return direction
    }

    private createEasyStarGrid() {
        const grid: number[][] = [[]];

        for (let i = 0; i < this.tileMap.height; i++) {
            grid[i] = [];
            for (let j = 0; j < this.tileMap.width; j++) {
                // 判断当前格子是否为不可通行的地块
                let test = this.tileMap.layers.some((layer) => {
                    const tile = this.tileMap.getTileAt(j, i, false, layer.name);
                    return tile && tile.properties.collides;
                })
                if (test) {
                    grid[i][j] = 1;
                } else {
                    grid[i][j] = 0;
                }
            }
        }
        // console.log(grid)

        this.easystar.setGrid(grid);
        this.easystar.setAcceptableTiles([0]);
        this.easystar.enableDiagonals();
        this.easystar.enableCornerCutting();
        this.easystar.setTileCost(1, 1.4); // 对角线移动代价为1.4
    }

    private checkArea() {
        const coordinate = this.getTilePos()
        // 判断是否避开遮挡
        let highland = this.tileMap.layers.some((layer) => {
            const tile = this.tileMap.getTileAt(coordinate.x, coordinate.y, false, layer.name);
            return tile && tile.properties.area === "highland";
        })
        if (highland) {
            this.container.setDepth(21)
        } else {
            this.container.setDepth(3)
        }
    }

    // 获取角色脚下坐标
    getPosition(): Phaser.Math.Vector2 {
        // return this.sprite.getBottomCenter();
        return new Phaser.Math.Vector2(this.container.x, this.container.y);
    }

    // 设置角色位置坐标
    setPosition(position: Phaser.Math.Vector2): void {
        this.container.setPosition(position.x, position.y);
    }

    stopAnimation(direction: Direction) {
        // 支持斜向移动，但动画还是四向
        let tweensDirection = direction.split("_")[0]
        const tweensManager = this.sprite.anims.animationManager;
        const standingFrame = tweensManager.get(`${this.spriteName}_${tweensDirection}`).frames[1].frame.name;
        this.sprite.anims.stop();
        this.sprite.setFrame(standingFrame);
    }

    startAnimation(direction: Direction) {
        // 支持斜向移动，但动画还是四向
        let tweensDirection = direction.split("_")[0]
        this.sprite.anims.play(`${this.spriteName}_${tweensDirection}`);
    }

    resetToFront() {
        const tweensManager = this.sprite.anims.animationManager;
        const standingFrame = tweensManager.get(`${this.spriteName}_down`).frames[1].frame.name;
        this.sprite.setFrame(standingFrame);
    }

    getTilePos(): Phaser.Math.Vector2 {
        return this.tilePos.clone();
    }

    setTilePos(tilePosition: Phaser.Math.Vector2): void {
        this.tilePos = tilePosition.clone();
    }

    private createPlayerAnimation(name: string, startFrame: number, endFrame: number) {
        this.anims.create({
            key: name,
            frames: this.anims.generateFrameNumbers(this.spriteName, {
                start: startFrame,
                end: endFrame,
            }),
            frameRate: 10,
            repeat: -1,
            yoyo: true,
        });
    }

    fadeIn() {
        return new Promise((resolve, reject) => {
            this.tweens.add({
                targets: this.container,
                alpha: 1,
                duration: 1000,
                onComplete: () => {
                    resolve(true)
                },
            })
        })
    }

    fadeOut() {
        return new Promise((resolve, reject) => {
            this.tweens.add({
                targets: this.container,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    resolve(true)
                },
            })
        })
    }

    invisibility() {
        return new Promise((resolve, reject) => {
            this.tweens.add({
                targets: this.container,
                alpha: 0.5,
                duration: 1000,
                onComplete: () => {
                    resolve(true)
                },
            })
        })
    }

    jump(spaceKey: Phaser.Input.Keyboard.Key) {
        this.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 20,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeInOut',
            onComplete: function () {
                spaceKey.enabled = true
            }
        })

        this.tweens.add({
            targets: this.nameLabel,
            y: this.nameLabel.y - 20,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeInOut',
            onComplete: function () {
                spaceKey.enabled = true
            }
        })
    }

}