/**
 * Jest测试设置文件
 */

// 模拟Chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn()
  }
} as any;

// 模拟window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://jimeng.jianying.com/detail/123',
    pathname: '/detail/123',
    hostname: 'jimeng.jianying.com'
  },
  writable: true
});

// 模拟history API
window.history.pushState = jest.fn();
window.history.replaceState = jest.fn();

// 全局测试超时设置
jest.setTimeout(10000); 