import Entity from "../Entity";

export default interface IComp {
    canRecycle: boolean;
    entity: Entity | null;
    reset(): void;
}