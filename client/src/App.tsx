import axios from 'axios';
import './App.css';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RegisterPage from './pages/RegisterPage';



const App = () => {
  const [returnFromServer, setReturnFromServer] = useState<string>();

  //data will be the string we send from our server
  const apiCall = () => {
    axios.post<void, {data: {description: string}}>('http://localhost:8081').then((data) => {
      const newExpense = `New expense: ${data.data.description}`;
      //this console.log will be in our frontend console
      setReturnFromServer(newExpense);
      console.log(data.data);
    })
  }

  //data will be the string we send from our server
  const apiCallExpenses = () => {
    axios.get<void, {data: string}>('http://localhost:8081/expenses').then((data) => {
      //this console.log will be in our frontend console
      console.log(data.data);
    })
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <div className="App">
                  <header className="App-header">

                    <button onClick={apiCall}>Make API Call</button>
                    <button onClick={apiCallExpenses}>Get expenses</button>
                    <h1 style={{color: "white"}}>{returnFromServer}</h1>

                  </header>
                </div>
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to home */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;