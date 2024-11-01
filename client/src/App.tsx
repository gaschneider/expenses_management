import axios from 'axios';
import './App.css';
import { useState } from 'react';



const App = () => {
  const [returnFromServer, setReturnFromServer] = useState<string>();

  //data will be the string we send from our server
  const apiCall = () => {
    axios.get<void, {data: {description: string}}>('http://localhost:8081').then((data) => {
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
    <div className="App">
      <header className="App-header">

        <button onClick={apiCall}>Make API Call</button>
        <button onClick={apiCallExpenses}>Get expenses</button>
        <h1 style={{color: "white"}}>{returnFromServer}</h1>

      </header>
    </div>
  );
}

export default App;