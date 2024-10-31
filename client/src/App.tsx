import axios from 'axios';
import './App.css';
import { useState } from 'react';



const App = () => {
  const [returnFromServer, setReturnFromServer] = useState<string>();

  //data will be the string we send from our server
  const apiCall = () => {
    axios.get<void, {data: string}>('http://localhost:8081').then((data) => {
      //this console.log will be in our frontend console
      setReturnFromServer(data.data);
    })
  }

  return (
    <div className="App">
      <header className="App-header">

        <button onClick={apiCall}>Make API Call</button>
        <h1 style={{color: "white"}}>{returnFromServer}</h1>

      </header>
    </div>
  );
}

export default App;