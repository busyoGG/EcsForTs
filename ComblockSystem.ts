import ECSManager from "./ECSManager";
import Entity from "./Entity";
import Group from "./Group";
import { IMatcher } from "./Interface/IMatcher";
import { IEntityEnterSystem, ISystemFirstUpdate, IEntityRemoveSystem } from "./Interface/ISystem";

export abstract class ComblockSystem<E extends Entity = Entity> {
    protected _group: Group<E>;
    protected _dt: number = 0;

    private _enteredEntities: Map<number, E> | null = null;
    private _removedEntities: Map<number, E> | null = null;

    private _hasEntityEnter: boolean = false;
    private _hasEntityRemove: boolean = false;

    private _tmpExecute: ((dt: number) => void) | null = null;
    private execute!: (dt: number) => void;

    constructor() {
        let hasOwnProperty = Object.hasOwnProperty;
        let prototype = Object.getPrototypeOf(this);
        let hasEntityEnter = hasOwnProperty.call(prototype, 'entityEnter');
        let hasEntityRemove = hasOwnProperty.call(prototype, 'entityRemove');
        let hasFirstUpdate = hasOwnProperty.call(prototype, 'firstUpdate');

        this._hasEntityEnter = hasEntityEnter;
        this._hasEntityRemove = hasEntityRemove;

        if (hasEntityEnter || hasEntityRemove) {
            this._enteredEntities = new Map<number, E>();
            this._removedEntities = new Map<number, E>();

            this.execute = this.execute1;
            this._group = ECSManager.getInst().createGroup(this.filter());
            this._group.watchEntityEnterAndRemove(this._enteredEntities, this._removedEntities);
        }
        else {
            this.execute = this.execute0;
            this._group = ECSManager.getInst().createGroup(this.filter());
        }

        if (hasFirstUpdate) {
            this._tmpExecute = this.execute;
            this.execute = this.updateOnce;
        }
    }

    init(): void {

    }

    onDestroy(): void {

    }

    hasEntity(): boolean {
        return this._group.count > 0;
    }

    private updateOnce(dt: number) {
        if (this._group.count === 0) {
            return;
        }
        this._dt = dt;
        // 处理刚进来的实体
        if (this._enteredEntities && this._enteredEntities.size > 0) {
            (this as unknown as IEntityEnterSystem).entityEnter(Array.from(this._enteredEntities.values()) as E[]);
            this._enteredEntities.clear();
        }
        (this as unknown as ISystemFirstUpdate).firstUpdate(this._group.matchEntities);
        this.execute = this._tmpExecute!;
        this.execute(dt);
        this._tmpExecute = null;
    }

    /**
     * 只执行update
     * @param dt 
     * @returns 
     */
    private execute0(dt: number): void {
        if (this._group.count === 0) {
            return;
        }
        this._dt = dt;
        this.update(this._group.matchEntities);
    }

    /**
     * 先执行entityRemove，再执行entityEnter，最后执行update。
     * @param dt 
     * @returns 
     */
    private execute1(dt: number): void {
        if (this._removedEntities && this._removedEntities.size > 0) {
            if (this._hasEntityRemove) {
                (this as unknown as IEntityRemoveSystem).entityRemove(Array.from(this._removedEntities.values()) as E[]);
            }
            this._removedEntities.clear();
        }
        if (this._group.count === 0) {
            return;
        }
        this._dt = dt;
        // 处理刚进来的实体
        if (this._enteredEntities && this._enteredEntities.size > 0) {
            if (this._hasEntityEnter) {
                (this as unknown as IEntityEnterSystem).entityEnter(Array.from(this._enteredEntities.values()) as E[]);
            }
            this._enteredEntities.clear();
        }
        this.update(this._group.matchEntities as E[]);
    }

    /**
     * 实体过滤规则
     * 
     * 根据提供的组件过滤实体。
     */
    abstract filter(): IMatcher;
    abstract update(entities: E[]): void;
}