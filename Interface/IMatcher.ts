import Entity from "../Entity";

export interface IMatcher {
    mid: number;
    indices: number[];
    key: string;
    isMatch(entity: Entity): boolean;
}