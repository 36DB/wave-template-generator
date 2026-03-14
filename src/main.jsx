import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import BoardPage from "./BoardPage";
import AnalyticsTracker from "./AnalyticsTracker";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/board" element={<BoardPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);