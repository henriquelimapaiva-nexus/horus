// src/pages/consultor/ias/ModalNegociacao.jsx
import { useState } from "react";
import Botao from "../../../components/ui/Botao";
import Input from "../../../components/ui/Input";

export default function ModalNegociacao({
  mostrar,
  onClose,
  resultado,
  formatarMoeda,
  onConfirmar
}) {
  const [opcaoNegociacao, setOpcaoNegociacao] = useState("aceitar");
  const [valorNegociado, setValorNegociado] = useState("");
  const [motivoNegociacao, setMotivoNegociacao] = useState("");

  if (!mostrar) return null;

  const handleConfirmar = () => {
    onConfirmar({ opcaoNegociacao, valorNegociado, motivoNegociacao });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "30px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "90vh",
        overflow: "auto"
      }}>
        <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>💰 Negociação do Contrato</h2>

        <p style={{ marginBottom: "15px" }}>
          <strong>Preço sugerido pela IA:</strong> {formatarMoeda(resultado.precos.ideal)}
        </p>
        <p style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
          Faixa de negociação: {formatarMoeda(resultado.precos.minimo)} - {formatarMoeda(resultado.precos.maximo)}
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="radio"
              value="aceitar"
              checked={opcaoNegociacao === "aceitar"}
              onChange={(e) => setOpcaoNegociacao(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            Aceitar preço sugerido: {formatarMoeda(resultado.precos.ideal)}
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="radio"
              value="negociar"
              checked={opcaoNegociacao === "negociar"}
              onChange={(e) => setOpcaoNegociacao(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            Negociar novo valor
          </label>

          {opcaoNegociacao === "negociar" && (
            <div style={{ marginTop: "15px", marginLeft: "25px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>
                  Novo valor (R$)
                </label>
                <input
                  type="text"
                  value={valorNegociado}
                  onChange={(e) => {
                    const apenasNumeros = e.target.value.replace(/\D/g, '');
                    setValorNegociado(apenasNumeros);
                  }}
                  placeholder="Ex: 55000"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>
                  Motivo da negociação (opcional)
                </label>
                <textarea
                  value={motivoNegociacao}
                  onChange={(e) => setMotivoNegociacao(e.target.value)}
                  placeholder="Ex: Cliente solicitou desconto, projeto piloto, etc"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Botao variant="secondary" onClick={onClose}>Cancelar</Botao>
          <Botao variant="primary" onClick={handleConfirmar}>✅ Gerar Contrato</Botao>
        </div>
      </div>
    </div>
  );
}