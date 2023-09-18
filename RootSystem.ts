import { ComblockSystem } from "./ComBlockSystem";
import { System } from "./System";

/**
 * System的root，对游戏中的System遍历从这里开始。
 * 
 * 一个System组合中只能有一个RootSystem，可以有多个并行的RootSystem。
 */
export class RootSystem {
    private executeSystemFlows: ComblockSystem[] = [];
    private systemCnt: number = 0;

    add(system: System | ComblockSystem) {
        if (system instanceof System) {
            // 将嵌套的System都“摊平”，放在根System中进行遍历，减少execute的频繁进入退出。
            Array.prototype.push.apply(this.executeSystemFlows, system.comblockSystems);
        }
        else {
            this.executeSystemFlows.push(system as ComblockSystem);
        }
        this.systemCnt = this.executeSystemFlows.length;
        return this;
    }

    init() {
        this.executeSystemFlows.forEach(sys => sys.init());
    }

    execute(dt: number) {
        for (let i = 0; i < this.systemCnt; i++) {
            // @ts-ignore
            this.executeSystemFlows[i].execute(dt);
        }
    }

    clear() {
        this.executeSystemFlows.forEach(sys => sys.onDestroy());
    }
}