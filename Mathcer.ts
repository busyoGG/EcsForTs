import ECSManager, { CompTypeUnion } from "./ECSManager";
import Entity from "./Entity";
import { AllOf, AnyOf, BaseOf, ExcludeOf } from "./FilterRule";
import IComp from "./Interface/IComp";
import { IMatcher } from "./Interface/IMatcher";

/**
    * 筛选规则间是“与”的关系
    * 比如：ecs.Macher.allOf(...).excludeOf(...)表达的是allOf && excludeOf，即实体有“这些组件” 并且 “没有这些组件”
    */
export class Matcher implements IMatcher {
    protected rules: BaseOf[] = [];
    protected _indices: number[] | null = null;
    // public isMatch!: (entity: Entity) => boolean;
    public mid: number = -1;

    private _key: string | null = null;
    public get key(): string {
        if (!this._key) {
            let s = '';
            for (let i = 0; i < this.rules.length; i++) {
                s += this.rules[i].getKey()
                if (i < this.rules.length - 1) {
                    s += ' && '
                }
            }
            this._key = s;
        }
        return this._key;
    }

    constructor() {
        this.mid = ECSManager.getInst().getMatherId();
    }

    /**
     * 匹配器关注的组件索引。在创建Group时，Context根据组件id去给Group关联组件的添加和移除事件。
     */
    public get indices() {
        if (this._indices === null) {
            this._indices = [];
            this.rules.forEach((rule) => {
                Array.prototype.push.apply(this._indices, rule.indices);
            });
        }
        return this._indices;
    }

    /**
     * 组件间是或的关系，表示关注拥有任意一个这些组件的实体。
     * @param args 组件索引
     */
    public anyOf(...args: CompTypeUnion<IComp>[]): Matcher {
        this.rules.push(new AnyOf(...args));
        return this;
    }

    /**
     * 组件间是与的关系，表示关注拥有所有这些组件的实体。
     * @param args 组件索引
     */
    public allOf(...args: CompTypeUnion<IComp>[]): Matcher {
        this.rules.push(new AllOf(...args));
        return this;
    }

    /**
     * 表示关注只拥有这些组件的实体
     * 
     * 注意：
     *  不是特殊情况不建议使用onlyOf。因为onlyOf会监听所有组件的添加和删除事件。
     * @param args 组件索引
     */
    public onlyOf(...args: CompTypeUnion<IComp>[]): Matcher {
        this.rules.push(new AllOf(...args));
        let otherTids: CompTypeUnion<IComp>[] = [];
        for (let comp of ECSManager.getInst().getComps()) {
            if (args.indexOf(comp) < 0) {
                otherTids.push(comp);
            }
        }
        this.rules.push(new ExcludeOf(...otherTids));
        return this;
    }

    /**
     * 不包含指定的任意一个组件
     * @param args 
     */
    public excludeOf(...args: CompTypeUnion<IComp>[]) {
        this.rules.push(new ExcludeOf(...args));
        return this;
    }

    public isMatch(entity: Entity): boolean {
        for (let rule of this.rules) {
            if (!rule.isMatch(entity)) {
                return false;
            }
        }
        return true;
    }

    public clone(): Matcher {
        let newMatcher = new Matcher();
        newMatcher.mid = ECSManager.getInst().getMatherId();
        this.rules.forEach(rule => newMatcher.rules.push(rule));
        return newMatcher;
    }
}