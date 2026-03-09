// src/layouts/PublicLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw" }}>
      <Outlet /> {/* Renderiza Splash ou Login */}
    </div>
  );
}