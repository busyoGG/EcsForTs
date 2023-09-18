import { CompTypeUnion } from "./ECSManager";
import Entity from "./Entity";
import { CompType } from "./Interface/CompType";
import IComp from "./Interface/IComp";
import Mask from "./Mask";

export abstract class BaseOf {
    protected mask = new Mask();
    public indices: number[] = [];
    constructor(...args: CompTypeUnion<IComp>[]) {
        let componentTypeId = -1;
        let len = args.length;
        for (let i = 0; i < len; i++) {
            if (typeof (args[i]) === "number") {
                componentTypeId = args[i] as number;
            }
            else {
                componentTypeId = (args[i] as CompType<IComp>).tid;
            }
            if (componentTypeId == -1) {
                console.error('存在没有注册的组件！');
            }
            this.mask.set(componentTypeId);

            if (this.indices.indexOf(componentTypeId) < 0) { // 去重
                this.indices.push(componentTypeId);
            }
        }
        if (len > 1) {
            this.indices.sort((a, b) => { return a - b; }); // 对组件类型id进行排序，这样关注相同组件的系统就能共用同一个group
        }
    }

    public toString(): string {
        return this.indices.join('-'); // 生成group的key
    }

    public abstract getKey(): string;

    public abstract isMatch(entity: Entity): boolean;
}

/**
 * 用于描述包含任意一个这些组件的实体
 */
export class AnyOf extends BaseOf {
    public isMatch(entity: Entity): boolean {
        // @ts-ignore
        return this.mask.or(entity.mask);
    }

    getKey(): string {
        return 'anyOf:' + this.toString();
    }
}

/**
 * 用于描述包含了“这些”组件的实体，这个实体除了包含这些组件还可以包含其他组件
 */
export class AllOf extends BaseOf {
    public isMatch(entity: Entity): boolean {
        // @ts-ignore
        return this.mask.and(entity.mask);
    }

    getKey(): string {
        return 'allOf:' + this.toString();
    }
}

/**
 * 不包含指定的任意一个组件
 */
export class ExcludeOf extends BaseOf {

    public getKey(): string {
        return 'excludeOf:' + this.toString();
    }

    public isMatch(entity: Entity): boolean {
        // @ts-ignore
        return !this.mask.or(entity.mask);
    }
}