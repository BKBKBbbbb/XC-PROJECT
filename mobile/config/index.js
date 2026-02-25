const path = require('path');

const config = {
  projectName: 'yisu-mobile',
  date: '2026-2-21',
  designWidth: 375,
  deviceRatio: {
    375: 2 / 1,
    640: 1,
    750: 1,
    828: 1
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  mini: {},
  h5: {
    /**
     * 使用相对路径，避免刷新时静态资源 404 导致白屏
     * 如果你有自己的 CDN 或根路径再改成对应地址
     */
    publicPath: '/',
    staticDirectory: 'static',
    router: {
      /**
       * 使用 hash 路由，确保在普通静态服务器上刷新不会 404/白屏
       */
      mode: 'hash',
      customRoutes: {}
    }
  },
  webpackChain(chain) {
    // 排除 .config.js 文件不被 babel-loader 处理
    chain.module.rule('js').exclude.add(path.resolve(__dirname, '../src/app.config.js'));
    return chain;
  }
};

module.exports = function(merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
