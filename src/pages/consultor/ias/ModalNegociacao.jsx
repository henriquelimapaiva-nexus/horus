// src/pages/consultor/ias/ModalNegociacao.jsx
import { useState, useEffect } from "react";
import Botao from "../../../components/ui/Botao";
import Input from "../../../components/ui/Input";

export default function ModalNegociacao({
  mostrar,
  onClose,
  resultado,
  formatarMoeda,
  dadosContrato,
  setDadosContrato,
  opcaoNegociacao,
  setOpcaoNegociacao,
  valorNegociado,
  setValorNegociado,
  motivoNegociacao,
  setMotivoNegociacao,
  carregandoContrato,
  onGerarContrato
}) {
  if (!mostrar) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
        <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>
          💰 Negociação do Contrato
        </h2>

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
              checked={opcaoNegociacao === 'aceitar'}
              onChange={(e) => setOpcaoNegociacao(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            Aceitar preço sugerido: {formatarMoeda(resultado.precos.ideal)}
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="radio"
              value="negociar"
              checked={opcaoNegociacao === 'negociar'}
              onChange={(e) => setOpcaoNegociacao(e.target.value)}
              style={{ marginRight: "8px" }}
            />
            Negociar novo valor
          </label>

          {opcaoNegociacao === 'negociar' && (
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
                <input
                  type="text"
                  value={motivoNegociacao}
                  onChange={(e) => setMotivoNegociacao(e.target.value)}
                  placeholder="Ex: Cliente solicitou desconto, projeto piloto, etc"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <hr style={{ margin: "20px 0" }} />

        <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>📋 Dados para o Contrato</h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
          Estes dados serão inseridos no contrato. Os campos em branco serão preenchidos como "[A PREENCHER]".
        </p>

        <div style={{ maxHeight: "400px", overflow: "auto", marginBottom: "20px" }}>
          <Input
            label="CNPJ da Empresa"
            value={dadosContrato.empresa_cnpj}
            onChange={(e) => setDadosContrato({...dadosContrato, empresa_cnpj: e.target.value})}
            placeholder="00.000.000/0001-00"
          />
          <Input
            label="Endereço da Empresa"
            value={dadosContrato.empresa_endereco}
            onChange={(e) => setDadosContrato({...dadosContrato, empresa_endereco: e.target.value})}
            placeholder="Rua, número, bairro, CEP"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input
              label="Cidade"
              value={dadosContrato.empresa_cidade}
              onChange={(e) => setDadosContrato({...dadosContrato, empresa_cidade: e.target.value})}
              placeholder="Cidade"
            />
            <Input
              label="Estado (UF)"
              value={dadosContrato.empresa_estado}
              onChange={(e) => setDadosContrato({...dadosContrato, empresa_estado: e.target.value})}
              placeholder="SP"
            />
          </div>
          
          <Input
            label="Nome do Representante"
            value={dadosContrato.representante_nome}
            onChange={(e) => setDadosContrato({...dadosContrato, representante_nome: e.target.value})}
            placeholder="Nome completo"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input
              label="RG"
              value={dadosContrato.representante_rg}
              onChange={(e) => setDadosContrato({...dadosContrato, representante_rg: e.target.value})}
              placeholder="RG"
            />
            <Input
              label="CPF"
              value={dadosContrato.representante_cpf}
              onChange={(e) => setDadosContrato({...dadosContrato, representante_cpf: e.target.value})}
              placeholder="CPF"
            />
          </div>
          
          <Input
            label="E-mail da CONTRATANTE"
            type="email"
            value={dadosContrato.email_contratante}
            onChange={(e) => setDadosContrato({...dadosContrato, email_contratante: e.target.value})}
            placeholder="contato@empresa.com.br"
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Botao variant="secondary" onClick={onClose}>
            Cancelar
          </Botao>
          <Botao variant="primary" onClick={onGerarContrato} loading={carregandoContrato}>
            {carregandoContrato ? 'Gerando...' : '✅ Gerar Contrato'}
          </Botao>
        </div>
      </div>
    </div>
  );
}