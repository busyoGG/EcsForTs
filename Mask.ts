import ECSManager from "./ECSManager";

export default class Mask {
    /** 32位二进制数组 由于&操作符最大只能30位操作 故每个三十二位二进制保存30个组件 */
    private mask: Uint32Array;
    private size: number = 0;

    constructor() {
        //计算32位掩码数量  (总组件数/31)
        let length = Math.ceil(ECSManager.getInst().getCompTid() / 31);
        this.mask = new Uint32Array(length);
        this.size = length;
    }

    /**
     * 设置掩码 或
     * @param num 
     */
    set(num: number) {
        this.mask[((num / 31) >>> 0)] |= (1 << (num % 31));
    }

    /**
     * 移除掩码 与 取反
     * @param num 
     */
    delete(num: number) {
        this.mask[((num / 31) >>> 0)] &= ~(1 << (num % 31));
    }

    /**
     * 查找 与
     * @param num 
     * @returns 
     */
    has(num: number) {
        // !!取布尔值 0或1
        return !!(this.mask[((num / 31) >>> 0)] & (1 << (num % 31)));
    }

    or(other: Mask) {
        for (let i = 0; i < this.size; i++) {
            // &操作符最大也只能对2^30进行操作，如果对2^31&2^31会得到负数。当然可以(2^31&2^31) >>> 0，这样多了一步右移操作。
            if (this.mask[i] & other.mask[i]) {
                return true;
            }
        }
        return false;
    }

    and(other: Mask) {
        for (let i = 0; i < this.size; i++) {
            if ((this.mask[i] & other.mask[i]) != this.mask[i]) {
                return false;
            }
        }
        return true;
    }

    clear() {
        for (let i = 0; i < this.size; i++) {
            this.mask[i] = 0;
        }
    }
}