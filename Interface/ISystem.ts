import Entity from "../Entity";

/**
 * 如果需要监听实体首次进入System的情况，实现这个接口。
 * 
 * entityEnter会在update方法之前执行，实体进入后，不会再次进入entityEnter方法中。
 * 当实体从当前System移除，下次再次符合条件进入System也会执行上述流程。
 */
export interface IEntityEnterSystem<E extends Entity = Entity> {
    entityEnter(entities: E[]): void;
}

/**
 * 如果需要监听实体从当前System移除，需要实现这个接口。
 */
export interface IEntityRemoveSystem<E extends Entity = Entity> {
    entityRemove(entities: E[]): void;
}

/**
 * 第一次执行update
 */
export interface ISystemFirstUpdate<E extends Entity = Entity> {
    firstUpdate(entities: E[]): void;
}