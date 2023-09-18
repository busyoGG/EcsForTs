import Entity from "./Entity";
import IComp from "./Interface/IComp";

export abstract class Comp implements IComp {
    static tid = -1;
    static compName: string;
    public canRecycle: boolean = true;
    public entity: Entity | null;
    abstract reset(): void;
}