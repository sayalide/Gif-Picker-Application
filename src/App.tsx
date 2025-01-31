import React from "react";
import GifPicker from "./GifPicker";
import "./index.css";

const App: React.FC = () => {
  return (
    <div>
      <h1 className="dashboard-title">GIF Picker</h1>
      <GifPicker />
    </div>
  );
};

export default App;
