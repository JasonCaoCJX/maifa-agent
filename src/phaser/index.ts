import * as Phaser from "phaser";
import { Player } from "./Player";
import { Space } from "@/phaser/Space";

import { players } from "@/agent/data";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: "AgentGame",
};

export class Game extends Phaser.Scene {
    // 地块大小
    static readonly CANVAS_WIDTH = window.innerWidth;
    static readonly CANVAS_HEIGHT = window.innerHeight;
    static readonly SCALE = 2
    static readonly TILE_SIZE = 16 * Game.SCALE;
    public map!: Phaser.Tilemaps.Tilemap;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

    private space: Space = new Space()
    private playerList: any = {}

    constructor() {
        super(sceneConfig);
        // this.space = new Space(this.load, this.make)
        for (let uid in players) {
            this.playerList[uid] = new Player(
                {
                    uid: uid, 
                    name: players[uid].name, 
                    avatar: players[uid].avatar
                }, 
                new Phaser.Math.Vector2(players[uid].target.birth[0], players[uid].target.birth[1])
            )
        }
       
    }

    public preload() {
        // this.load.image("tiles", tiles);
        // this.load.tilemapTiledJSON("cloud-city-map", map);
        this.space.preload(this.load)
        for (let uid in this.playerList) {
            this.playerList[uid].preload(this.load)
        }
        
    }

    public create() {
        // 场景
        this.map = this.space.create(this.make, this.add)
        for (let uid in this.playerList) {
            this.playerList[uid].create(this.add, this.tweens, this.anims, this.map)
        }

        // 相机跟随角色
        // this.cameras.main.startFollow(container);
        // this.cameras.main.setFollowOffset(0, Game.TILE_SIZE / 2)
        // this.cameras.main.roundPixels = true;


        this.cameras.main.setZoom(0.75)
        this.cameras.main.centerOn(this.map.widthInPixels * Game.SCALE / 2, this.map.heightInPixels * Game.SCALE / 2);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown', (event: any) => {
            switch(event.key) {
                case "-": if (this.cameras.main.zoom > 0.5) {this.cameras.main.zoom -= 0.25}; break
                case "=": if (this.cameras.main.zoom < 2.5) {this.cameras.main.zoom += 0.25}; break
            }
        });
        

        this.addListener()
    }

    public update(_time: number, delta: number) {
        if (this.cursors.up.isDown) {
            this.cameras.main.scrollY -= 10;
        } else if (this.cursors.down.isDown) {
            this.cameras.main.scrollY += 10;
        }
    
        if (this.cursors.left.isDown) {
            this.cameras.main.scrollX -= 10;
        } else if (this.cursors.right.isDown) {
            this.cameras.main.scrollX += 10;
        }
    }

    private boardcast(message: string, duration: number) {
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

        // 获取文本内容的高度
        const textHeight = text.getBounds().height
        const bubbleHieght = textHeight + padding * 2

        graphics.fillStyle(0xffffff, 1);
        graphics.lineStyle(2, 0x000000, 1);
        graphics.fillRoundedRect(0, 0, bubbleWidth, bubbleHieght, 10);
        graphics.strokeRoundedRect(0, 0, bubbleWidth, bubbleHieght, 10);

        const x = this.map.widthInPixels * Game.SCALE / 2  - (bubbleWidth / 2)
        const y = this.map.heightInPixels * Game.SCALE / 2 - (80 + bubbleHieght)

 
        const bubble = this.add.container(0, 0, [ graphics, text ])
        bubble.setPosition(x, y)
        bubble.setAlpha(0)
        bubble.setDepth(22)


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
                    bubble.destroy();
                },
            })
        }, duration)
    }   

    private addListener() {
        window.eventBus.subscribe("A_2_P_UPDATE_NAME", (agentList: any) => {
            for (let role in agentList) {
                for (let name in agentList[role]) {
                    const uid = agentList[role][name].playerInfo.uid
                    
                    this.playerList[uid].updateName(`${role} - ${name}`)
                }
            }
        })

        window.eventBus.subscribe("A_2_P_BACK_HOME", () => {
            for (let uid in this.playerList) {
                const target = players[uid].target.birth
                this.playerList[uid].autoMoving(target[0], target[1] - 2)
            }
        })

        window.eventBus.subscribe("A_2_P_GATHER", (uidArr: any) => {
            for (let uid of uidArr) {
                const target = players[uid].target.seat
                this.playerList[uid].autoMoving(target[0], target[1])
            }
        })

        window.eventBus.subscribe("A_2_P_SPEAK", (data: any) => {
            this.playerList[data.uid].sayWords(data.msg, data.duration)
        })

        window.eventBus.subscribe("A_2_P_BROADCAST", (data: any) => {
            this.boardcast(data.msg, data.duration)
        })

        window.eventBus.subscribe("A_2_P_KILL", (data: any) => {
            console.log(data)
            const target = players[data.kill].target.birth
            this.playerList[data.uid].autoMoving(target[0], target[1] - 2)
        })
    }
}

export function initGame(container: any) {
    const gameConfig: Phaser.Types.Core.GameConfig = {
        title: "AgentGame",
        render: {
            antialias: false,
        },
        type: Phaser.AUTO,
        scene: Game,
        scale: {
            width: Game.CANVAS_WIDTH,
            height: Game.CANVAS_HEIGHT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        parent: container,
        backgroundColor: "#48C4F8",
    };
    return new Phaser.Game(gameConfig);
}
