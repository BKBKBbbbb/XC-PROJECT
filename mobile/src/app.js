import { useLaunch } from '@tarojs/taro';
import './styles/index.scss';

function App({ children }) {
  useLaunch(() => {
    console.log('App launched.');
  });

  return children;
}

export default App;
