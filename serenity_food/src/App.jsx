import React, { useState } from "react";

// import Dashboard from "./components/MainApp";
import MainApp from "./components/MainApp";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="mt-4">
      <MainApp />
    </div>
  );
}

export default App;
