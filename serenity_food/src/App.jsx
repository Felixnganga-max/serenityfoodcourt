import React, { useState } from "react";

// import Dashboard from "./components/MainApp";
import MainApp from "./components/MainApp";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <MainApp />
    </>
  );
}

export default App;
