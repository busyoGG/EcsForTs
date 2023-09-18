import IComp from "./IComp";

export interface CompType<T> extends IComp {
    new(): T;
    tid: number;
    compName: string;
}