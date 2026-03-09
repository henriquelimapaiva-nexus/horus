// src/pages/SideMenu.jsx
import { useState, useEffect } from "react";
import api from "../api/api";

export default function SideMenu({ onFiltroChange }) {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(""); 
  const [periodo, setPeriodo] = useState("mes"); 

  useEffect(() => {
    api.get("/empresas")
      .then((res) => setEmpresas(res.data))
      .catch((err) => console.error("Erro ao buscar empresas:", err));
  }, []);

  // useEffect separado para quando empresaSelecionada mudar
  useEffect(() => {
    onFiltroChange({
      empresaId: empresaSelecionada ? Number(empresaSelecionada) : null,
      periodo,
    });
  }, [empresaSelecionada]); // Só executa quando empresa mudar

  // useEffect separado para quando periodo mudar
  useEffect(() => {
    onFiltroChange({
      empresaId: empresaSelecionada ? Number(empresaSelecionada) : null,
      periodo,
    });
  }, [periodo]); // Só executa quando período mudar

  return (
    <div style={{
      width: "250px",
      background: "#f1f5f9",
      padding: "20px",
      borderRight: "2px solid #e5e7eb",
      height: "calc(100vh - 60px)",
      position: "sticky",
      top: 0,
      overflowY: "auto"
    }}>
      <h3>Filtros</h3>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="empresa">Empresa:</label>
        <select
          id="empresa"
          value={empresaSelecionada}
          onChange={(e) => setEmpresaSelecionada(e.target.value)}
          style={{ width: "100%", padding: "6px", marginTop: "6px", borderRadius: "4px" }}
        >
          <option value="">Todas</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nome}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>Período:</label>
        <div style={{ marginTop: "6px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            <input
              type="radio"
              value="mes"
              checked={periodo === "mes"}
              onChange={() => setPeriodo("mes")}
              style={{ marginRight: "6px" }}
            />
            Último mês
          </label>
          <label style={{ display: "block" }}>
            <input
              type="radio"
              value="ano"
              checked={periodo === "ano"}
              onChange={() => setPeriodo("ano")}
              style={{ marginRight: "6px" }}
            />
            Último ano
          </label>
        </div>
      </div>
    </div>
  );
}