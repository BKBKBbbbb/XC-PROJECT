import { useLaunch } from '@tarojs/taro';

function App({ children }) {
  useLaunch(() => {
    console.log('App launched.');
  });

  return children;
}

export default App;
