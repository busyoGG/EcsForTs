import { Comp } from "./Comp";
import Entity from "./Entity";
import Group from "./Group";
import { CompType } from "./Interface/CompType";
import IComp from "./Interface/IComp";
import { IMatcher } from "./Interface/IMatcher";
import { Matcher } from "./Mathcer";

export type CompAddOrRemove = (entity: Entity) => void;
export type CompTypeUnion<T> = CompType<T> | number;
export default class ECSManager {
    private static _instance: ECSManager | null = null;

    private _compTid = 0;

    private _entityId = 1;

    private _matcherId = 1;

    /**
     * 注册池，判断是否存在同名组件或标签
     */
    private _registerPool = {};

    /**
     * 组件注册池
     */
    private _comps: any[] = [];
    /**
    * 组件缓存池
    */
    private _compPools: Map<number, Comp[]> = new Map();

    /**
     * tag池
     */
    private _tags: Map<number, string> = new Map();

    private _compAddOrRemove: Map<number, CompAddOrRemove[]> = new Map();
    /**
     * 实体池
     */
    private _eid2Entity: Map<number, Entity> = new Map();
    /**
     * 实体缓存池
     */
    private _eneityPool: Entity[] = [];

    private _groups: Map<number, Group> = new Map();

    public static getInst(): ECSManager {
        if (!this._instance) {
            this._instance = new ECSManager();
        }
        return this._instance;
    }

    public getCompTid() {
        return this._compTid;
    }

    //-----注册-----

    /**
     * 注册组件
     * @param compName 
     * @param canNew 
     * @returns 
     */
    public register<T>(compName: string, canNew: boolean = true) {
        return function (comp: CompType<T>) {
            if (comp.tid == -1) {
                let manager = ECSManager.getInst();
                if (manager._registerPool[compName]) {
                    console.warn("组件与标签重名:", compName);
                } else {
                    comp.tid = manager._compTid++;
                    comp.compName = compName;
                    if (canNew) {
                        manager._comps.push(comp);
                        manager._compPools.set(comp.tid, []);
                    }
                    else {
                        manager._comps.push(null);
                    }
                    manager._compAddOrRemove.set(comp.tid, []);
                    console.log("组件" + compName + "注册成功:", comp.tid)
                    manager._registerPool[compName] = true;
                }
            } else {
                console.log("组件已注册");
            }
        }
    }

    /**
     * 注册tag
     * @returns 
     */
    public registerTag() {
        return function (_class: any) {
            let manager = ECSManager.getInst();
            let tid = manager._compTid;
            for (let k in _class) {
                if (manager._registerPool[k]) {
                    console.warn("标签与组件重名:", k);
                } else {
                    tid = manager._compTid++;
                    _class[k] = tid;
                    manager._comps.push(tid);
                    manager._compPools.set(tid, []);
                    manager._compAddOrRemove.set(tid, []);
                    manager._tags.set(tid, k);
                    console.log("标签" + k + "注册成功:", tid)
                    manager._registerPool[k] = true;
                }
            }
        }
    }

    //-----注册-----

    //-----tag-----

    /**
     * 是否有tag
     * @param id 
     * @returns 
     */
    public hasTag(id: number) {
        return this._tags.has(id);
    }

    /**
     * 获得tag
     * @param id 
     * @returns 
     */
    public getTag(id: number): string {
        return this._tags.get(id) as string;
    }

    //-----tag-----

    //-----组件-----

    /**
     * 回收组件
     * @param id 组件id
     * @param comp 组件实例
     */
    public recycle(id: number, comp: IComp) {
        this._compPools.get(id)?.push(comp);
    }

    /**
     * 创建组件
     * @param comp 
     * @returns 
     */
    public createComp<T>(comp: CompType<T>) {
        if (!this._comps[comp.tid]) {
            console.error("未找到组件" + comp.compName)
        }
        let compInstance = this._compPools.get(comp.tid)?.pop() || new this._comps[comp.tid];
        return compInstance;
    }

    /**
     * 获得所有组件
     * @returns 
     */
    public getComps() {
        return this._comps;
    }

    /**
    * 实体身上组件有增删操作，广播通知对应的观察者。
    * @param entity 实体对象
    * @param componentTypeId 组件类型id
    */
    public broadcastCompAddOrRemove(entity: Entity, componentTypeId: number) {
        let events = this._compAddOrRemove.get(componentTypeId);
        if (events) {
            for (let i = events.length - 1; i >= 0; i--) {
                events![i](entity);
            }
        }
    }

    //-----组件-----

    //-----实体-----

    /**
     * 创建实体
     * @returns 
     */
    public createEntity<E extends Entity = Entity>(): E {
        let entity = this._eneityPool.pop();
        if (!entity) {
            entity = new Entity();
            entity.eid = this._entityId++;
        }
        this._eid2Entity.set(entity.eid, entity);
        return entity as E;
    }

    /**
     * 移除实体
     * @param id 实体id
     * @param entity 实体
     */
    public removeEntity(id: number, entity: Entity) {
        if (this._eid2Entity.has(id)) {
            this._eneityPool.push(entity);
            this._eid2Entity.delete(id);
        } else {
            console.warn("试图销毁不存在的实体");
        }
    }

    /**
     * 根据eid获取实体
     * @param eid 
     * @returns 
     */
    public getEntityByEid(eid: number) {
        return this._eid2Entity.get(eid);
    }

    /**
     * 获得当前活动实体数量
     * @returns 
     */
    public activeEntityCount() {
        return this._eid2Entity.size;
    }

    /**
    * 清除
    */
    public clear() {
        this._eid2Entity.forEach((entity) => {
            entity.removeSelf();
        });
        this._groups.forEach((group) => {
            group.clear();
        });
        this._compAddOrRemove.forEach(callbackLst => {
            callbackLst.length = 0;
        });
        this._eid2Entity.clear();
        this._groups.clear();
    }

    //-----实体-----

    //-----群组-----

    /**
     * 创建群组
     * @param matcher 
     */
    public createGroup<E extends Entity = Entity>(matcher: IMatcher): Group<E> {
        let group = this._groups.get(matcher.mid);
        if (!group) {
            group = new Group(matcher);
            this._groups.set(matcher.mid, group);
            let careCompIds = matcher.indices;
            for (let i = 0, len = careCompIds.length; i < len; i++) {
                let child = this._compAddOrRemove.get(careCompIds[i]);
                if (!child) {
                    child = [];
                    this._compAddOrRemove.set(careCompIds[i], child);
                }
                child.push(group.onComponentAddOrRemove.bind(group));
            }
        }
        return group as unknown as Group<E>;
    }

    public query(matcher: IMatcher) {
        let group = this._groups.get(matcher.mid);
        if (!group) {
            group = this.createGroup(matcher);
            this._eid2Entity.forEach(group.onComponentAddOrRemove, group);
        }
        return group.matchEntities;
    }

    //-----群组-----

    //-----过滤-----

    public getMatherId() {
        return this._matcherId++;
    }

    /**
     * 判断是否拥有所有对应组件
     * @param args 
     * @returns 
     */
    public allOf(...args: CompTypeUnion<IComp>[]) {
        return new Matcher().allOf(...args);
    }

    /**
     * 判断是否拥有任意对应组件
     * @param args 
     * @returns 
     */
    public anyOf(...args: CompTypeUnion<IComp>[]) {
        return new Matcher().anyOf(...args);
    }

    /**
     * 判断是否只包含所有对应组件
     * @param args 
     * @returns 
     */
    public onlyOf(...args: CompTypeUnion<IComp>[]) {
        return new Matcher().onlyOf(...args);
    }

    /**
     * 判断是否不包含任意对应组件
     * @param args 
     * @returns 
     */
    public excludeOf(...args: CompTypeUnion<IComp>[]) {
        return new Matcher().excludeOf();
    }

    //-----过滤-----
}