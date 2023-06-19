import { Game } from "@/phaser";

import tiles from "../assets/cloud_tileset.png";
import map from "../assets/maifa_city.tmj.json";

export class Space {
    private map!: Phaser.Tilemaps.Tilemap;
    private load!: Phaser.Loader.LoaderPlugin
    private make!: Phaser.GameObjects.GameObjectCreator
    private add!: Phaser.GameObjects.GameObjectFactory

    constructor() { }

    preload(load: Phaser.Loader.LoaderPlugin) {
        this.load = load
        // console.log(this.load)
        this.load.image("tiles", tiles);
        this.load.tilemapTiledJSON("cloud-city-map", map);
    }

    create(make: Phaser.GameObjects.GameObjectCreator, add: Phaser.GameObjects.GameObjectFactory) {
        this.make = make
        this.add = add

        this.map = this.make.tilemap({ key: "cloud-city-map" });
        this.map.addTilesetImage("MaifaCity", "tiles");
        for (let i = 0; i < this.map.layers.length; i++) {
            const layer = this.map.createLayer(i, "MaifaCity", 0, 0);
            if (this.map.layers[i].name === "cover") {
                layer.setDepth(10);
            } else {
                layer.setDepth(i);
            }
            layer.scale = Game.SCALE;
        }

        let objectLayer = this.map.getObjectLayer('text');
        console.log(objectLayer)
        let objects = objectLayer.objects;
        objects.forEach((obj: any) => {
            if (obj.type === 'text') {
                let text = this.add.text(obj.x * Game.SCALE + obj.width, obj.y * Game.SCALE, obj.text.text, {
                    fontFamily: obj.text.fontfamily,
                    fontSize: (obj.height * Game.SCALE).toString() + "px",
                    fontStyle: obj.text.bold ? 'bold' : 'normal',
                    color: obj.text.color,
                    align: obj.text.halign,
                    wordWrap: obj.text.wrap,
                });
                text.setDepth(11)
                text.setOrigin(0.5, 0)
            }
        });
        // console.log(this.map)
        return this.map
    }


}