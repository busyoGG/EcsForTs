import { ComblockSystem } from "./ComBlockSystem";

/**
 * 系统组合器，用于将多个相同功能模块的系统逻辑上放在一起。System也可以嵌套System。
 */
export class System {
    private _comblockSystems: ComblockSystem[] = [];
    get comblockSystems() {
        return this._comblockSystems;
    }

    add(system: System | ComblockSystem) {
        if (system instanceof System) {
            Array.prototype.push.apply(this._comblockSystems, system._comblockSystems);
            system._comblockSystems.length = 0;
        }
        else {
            this._comblockSystems.push(system as ComblockSystem);
        }
        return this;
    }
}