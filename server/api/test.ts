import axios from 'axios';
export default defineEventHandler(async event => {
  // 获取查询参数
  const query = getQuery(event);
  const { url } = query;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
  };
  const response = await axios(url as string, {
    method: 'GET',
    headers,
  });
  // 返回响应数据
  return {
    status: 'success',
    message: `success!`,
    data: {
      timestamp: Date.now(),
      url: response.request.res.responseUrl,
    },
  };
});
