import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HotelManage from './pages/HotelManage';
import HotelForm from './pages/HotelForm';
import ReviewManage from './pages/ReviewManage';
import './App.css';

// 路由守卫
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    // React Router 6 使用 Routes + Route 的嵌套路由模式
    // 比 v5 的 Switch 更简洁。
    // element={<Component />} 传递的是 React Element 而不是 Component 对象。
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/hotel" element={
          <PrivateRoute><HotelManage /></PrivateRoute>
        } />
        <Route path="/hotel/add" element={
          <PrivateRoute><HotelForm /></PrivateRoute>
        } />
        <Route path="/hotel/edit/:id" element={
          <PrivateRoute><HotelForm /></PrivateRoute>
        } />
        <Route path="/review" element={
          <PrivateRoute><ReviewManage /></PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;
