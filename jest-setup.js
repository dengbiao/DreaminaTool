// Jest全局设置
import { jest } from "@jest/globals";

// 全局暴露Jest，让旧测试代码能正常工作
global.jest = jest;
global.describe = describe;
global.test = test;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
