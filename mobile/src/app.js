import { Component } from 'react';
import { createApp } from 'tarojs';
import './styles/index.scss';

class App extends Component {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return this.props.children;
  }
}

createApp(App);
