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
    publicPath: '/',
    staticDirectory: 'static',
    router: {
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
