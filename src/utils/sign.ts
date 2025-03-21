import md5 from 'md5';

export const SIGN_VER = 1;
export const PF = '7';
export const APP_VR = '5.8.0';
export const customHeaders = {
  pf: PF,
  appvr: APP_VR,
  tdid: '',
  'sign-ver': SIGN_VER,
};
// 定义 SignHeaderProps 类型
type SignHeaderProps = {
  url: string;
  pf: string;
  appvr: string;
  tdid: string;
};

function getURLObj(url: string): { pathname: string } {
  try {
    const urlObj = new URL(url);
    // 确保只返回纯路径部分，不包含查询参数
    return { pathname: urlObj.pathname };
  } catch (e) {
    return { pathname: url };
  }
}

export function generateSignHeader({ url, pf, appvr, tdid }: SignHeaderProps): {
  sign: string;
  'device-time': number;
} {
  const { pathname } = getURLObj(url);
  const deviceTime = Math.floor(Date.now() / 1000);
  const sign = md5(`9e2c|${pathname.slice(-7)}|${pf}|${appvr}|${deviceTime}|${tdid}|11ac`).toLowerCase();
  return {
    sign,
    'device-time': deviceTime,
  };
}

export function generateRequestHeaders(url: string): Record<string, string> {
  // 使用API路径来计算签名
  const signHeaders = generateSignHeader({
    ...customHeaders,
    url,
  });

  return {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'origin': window.location.origin,
    'referer': window.location.href,
    'appvr': APP_VR,
    'pf': PF,
    'device-time': signHeaders['device-time'].toString(),
    'sign': signHeaders.sign,
    'sign-ver': SIGN_VER.toString(),
  };
} 