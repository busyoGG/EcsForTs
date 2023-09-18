import ECSManager, { CompTypeUnion } from "./ECSManager";
import { CompType } from "./Interface/CompType";
import IComp from "./Interface/IComp";
import Mask from "./Mask";

export default class Entity {
    public eid: number = -1;
    private mask = new Mask();

    /**
     * 当前实体上的组件
     */
    private _compInEntity: Map<number, CompTypeUnion<IComp>> = new Map();
    /**
     * 保存在实体上的已移除的组件
     */
    private _compRemoved: Map<number, CompTypeUnion<IComp>> = new Map();

    constructor() { }

    /**
     * 添加组件
     * @param comp 
     * @param isReAdded 
     * @returns 
     */
    public add<T extends IComp>(comp: CompTypeUnion<T>, isReAdded = false): T | null{
        let compId;
        if (typeof (comp) == "number") {
            compId = comp;
            if (ECSManager.getInst().hasTag(comp)) {
                this.mask.set(comp);
                this._compInEntity.set(comp, comp);
                let tagName = ECSManager.getInst().getTag(comp)!;
                // @ts-ignore
                this[tagName] = comp;
                ECSManager.getInst().broadcastCompAddOrRemove(this, comp);
            }
            else {
                console.error('不存在的tag！');
            }
            return null;
        } else {
            compId = comp.tid;
            if (compId == -1) {
                console.error("组件未注册");
                return null;
            }

            if (this._compInEntity.has(compId)) {
                if (isReAdded) {
                    this.remove(comp);
                } else {
                    console.log("组件" + comp.compName + "已存在");
                    return this[comp.compName];
                }
            }

            this.mask.set(compId);

            let compInstance: T;
            if (this._compRemoved.has(compId)) {
                compInstance = this._compRemoved.get(compId) as unknown as T;
                this._compRemoved.delete(compId);
            } else {
                compInstance = ECSManager.getInst().createComp(comp);
            }

            this[comp.compName] = compInstance;
            this._compInEntity.set(compId, comp);
            compInstance.entity = this;
            //TODO 广播添加组件消息
            ECSManager.getInst().broadcastCompAddOrRemove(this, compId);

            return compInstance as T;
        }
    }

    /**
     * 添加组件
     * @param comps 
     * @returns 
     */
    public addComps(reAdded = false,...comps) {
        for (let comp of comps) {
            this.add(comp,reAdded);
        }
        return this;
    }

    /**
     * 获得组件
     * @param comp 
     * @returns 
     */
    public get<T>(comp: CompTypeUnion<T>) {
        let compName;
        if (typeof (comp) == "number") {
            compName = ECSManager.getInst().getTag(comp);
        } else {
            compName = comp.compName;
        }
        return this[compName] as T;
    }

    /**
     * 判断组件是否存在
     * @param comp 
     * @returns 
     */
    public has<T>(comp: CompTypeUnion<T>) {
        if (typeof (comp) == "number") {
            return this.mask.has(comp);
        } else {
            return this._compInEntity.has(comp.tid);
        }
    }

    private _remove(comp: CompTypeUnion<IComp>) {
        //TODO git上为false 此处测试true
        this.remove(comp, true);
    }

    /**
     * 移除组件
     * @param comp 组件
     * @param isRecycle 是否回收
     */
    public remove(comp: CompTypeUnion<IComp>, isRecycle: boolean = true) {
        let compName: string;
        let id = -1;
        let hasComp = false;
        if (typeof (comp) == "number") {
            id = comp;
            if (this.mask.has(id)) {
                hasComp = true;
                compName = ECSManager.getInst().getTag(id);
            } else {
                console.warn("试图移除不存在的tag");
                return;
            }
        } else {
            id = comp.tid;
            compName = comp.compName;
            if (this.mask.has(id)) {
                hasComp = true;
                let compInstance = this[compName] as CompType<IComp>;
                compInstance.entity = null;
                if (isRecycle) {
                    compInstance.reset();
                    if (compInstance.canRecycle) {
                        ECSManager.getInst().recycle(id, compInstance);
                    }
                } else {
                    this._compRemoved.set(id, compInstance);
                }
            } else {
                console.warn("试图移除不存在的组件",compName);
            }
        }

        if (hasComp) {
            this[compName] = null;
            this.mask.delete(id);
            this._compInEntity.delete(id);
            ECSManager.getInst().broadcastCompAddOrRemove(this, id);
            // console.log("广播移除组件", compName);
        }
    }

    /**
     * 移除组件
     * @param isRecycle 
     * @param args 
     */
    public removeComps(isRecycle = true, ...args:CompTypeUnion<IComp>[]) {
        for (let c of args) {
            this.remove(c, isRecycle);
        }
    }

    /**
     * 移除实体
     */
    public removeSelf() {
        this._compInEntity.forEach(this._remove, this);
        this._compRemoved.forEach(this._remove, this);
        ECSManager.getInst().removeEntity(this.eid, this);
    }
}