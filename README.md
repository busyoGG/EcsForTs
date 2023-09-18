# EcsForTs
Ts版ECS架构

## 简介

ECS架构是 实体（Entity）-组件（Component）-系统（System） 组成的架构，主要目的是对数据和逻辑进行解耦以便更好的维护系统。其运行的原理也能提高CPU的缓存命中，即可以提高游戏运行的性能。

## 使用方法

* Tag示例

```typescript Tag示例
import ECSManager from "../../../ECS/ECSManager";

@ECSManager.getInst().registerTag()
export default class StatusTags {
    public static StatusA = 0;
    public static StatusB = 1;
}
```

* Comp示例

```typescript Comp示例
import { Comp } from "../../../ECS/Comp";
import ECSManager from "../../../ECS/ECSManager";

@ECSManager.getInst().register("Transform")
export default class TransformComp extends Comp {
    /** 坐标 */
    public position: Laya.Vector3 = new Laya.Vector3();

    reset(): void {
        this.position.set(0, 0, 0);
    }
}
```

* Entity示例

```typescript Entity示例
import Entity from "../../../ECS/Entity";
import TransformComp from "../Comp/TransformComp";

export default class RoleEntity extends Entity {
    public Transform: TransformComp;
}
```

* ComblockSystem示例

```typescript ComblockSystem示例
import { ComblockSystem } from "../../../ECS/ComBlockSystem";
import ECSManager from "../../../ECS/ECSManager";
import { IMatcher } from "../../../ECS/Interface/IMatcher";
import { IEntityEnterSystem } from "../../../ECS/Interface/ISystem";
import ServantComp from "../Comp/ServantComp";
import WorkerComp from "../Comp/WorkerComp";
import RoleEntity from "../Entity/RoleEntity";

/**
 * 工作系统
 */
export default class WorkSystem extends ComblockSystem<RoleEntity> implements IEntityEnterSystem<RoleEntity>{

    entityEnter(entities: RoleEntity[]): void {
        for (let e of entities) {
            
        }
    }
    filter(): IMatcher {
        return ECSManager.getInst().anyOf(WorkerComp, ServantComp);
    }
    update(entities: RoleEntity[]): void {
        for (let e of entities) {
            
        }
    }
}
```

* RootSystem示例

```typescript RootSystem示例
import Globals from "../../../Config/Globals";
import { RootSystem } from "../../../ECS/RootSystem";
import CarShopSystem from "../System/CarShopSystem";
import CarSystem from "../System/CarSystem";
import CustomSystem from "../System/CustomSystem";
import DollSystem from "../System/DollSystem";
import MoveSystem from "../System/MoveSystem";
import NpcSystem from "../System/NpcSystem";
import PathFindingSystem from "../System/PathFindingSystem";
import WorkSystem from "../System/WorkSystem";

/**
 * 慢速根系统
 */
export default class RootSlowSystem extends RootSystem {
    constructor() {
        super();
        this.add(new WorkSystem());
    }
}
```

* 根系统调用示例

```typescript 根系统调用示例
    onAwake(){
        this._rootSlowSystem = new RootSlowSystem();
        this._rootSlowSystem.init();
    }

    onUpdate(){
        this._rootSlowSystem.execute(Laya.timer.delta);
    }

    onDisable() {
        this._rootSlowSystem.clear();
    }
```

详细内容见 [TS实现ECS架构](https://busyo.buzz/article/Laya/%E5%B7%A5%E5%85%B7/TS%E5%AE%9E%E7%8E%B0ECS%E6%9E%B6%E6%9E%84/)
参考项目见 [ECS](https://github.com/shangdibaozi/ECS/tree/master)
