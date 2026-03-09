// src/pages/consultor/ConsultorConfiguracoes.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import Botao from "../../components/ui/Botao";

// Cores exclusivas do consultor
const coresConsultor = {
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0891b2"
};

export default function ConsultorConfiguracoes() {
  const { usuario } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState("perfil");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Dados do perfil
  const [perfil, setPerfil] = useState({
    nome: usuario?.nome || "Consultor",
    email: usuario?.email || "consultor@nexus.com",
    telefone: "(11) 99999-9999",
    cargo: "Consultor Sênior",
    empresa: "Nexus Engenharia Aplicada",
    foto: null
  });

  // Missão, Visão e Valores
  const [institucional, setInstitucional] = useState({
    missao: "Transformar indústrias através da engenharia aplicada, maximizando eficiência e reduzindo perdas com soluções personalizadas e baseadas em dados.",
    visao: "Ser referência nacional em consultoria de otimização de processos industriais até 2030, impactando mais de 100 empresas com ganhos superiores a R$ 100 milhões.",
    valores: [
      "Excelência Técnica",
      "Transparência",
      "Inovação Constante",
      "Resultado para o Cliente",
      "Ética e Integridade",
      "Sustentabilidade"
    ],
    novoValor: ""
  });

  // Metas
  const [metas, setMetas] = useState({
    faturamentoAnual: 1200000,
    novosClientes: 15,
    satisfacao: 4.8,
    horasConsultoria: 800,
    projetosAnuais: 20
  });

  // Dados bancários
  const [banco, setBanco] = useState({
    banco: "Banco do Brasil",
    agencia: "1234-5",
    conta: "12345-6",
    tipo: "Corrente",
    pix: "consultor@nexus.com",
    chavePix: "email"
  });

  // Preferências
  const [preferencias, setPreferencias] = useState({
    tema: "claro",
    notificacoes: true,
    relatoriosAutomaticos: false,
    frequenciaRelatorios: "mensal",
    idioma: "pt-BR"
  });

  // Carregar dados salvos (simulado)
  useEffect(() => {
    const savedPerfil = localStorage.getItem("consultor_perfil");
    if (savedPerfil) setPerfil(JSON.parse(savedPerfil));

    const savedInstitucional = localStorage.getItem("consultor_institucional");
    if (savedInstitucional) setInstitucional(JSON.parse(savedInstitucional));

    const savedMetas = localStorage.getItem("consultor_metas");
    if (savedMetas) setMetas(JSON.parse(savedMetas));

    const savedBanco = localStorage.getItem("consultor_banco");
    if (savedBanco) setBanco(JSON.parse(savedBanco));

    const savedPreferencias = localStorage.getItem("consultor_preferencias");
    if (savedPreferencias) setPreferencias(JSON.parse(savedPreferencias));
  }, []);

  // Salvar dados
  const salvarDados = () => {
    setSalvando(true);
    
    try {
      localStorage.setItem("consultor_perfil", JSON.stringify(perfil));
      localStorage.setItem("consultor_institucional", JSON.stringify(institucional));
      localStorage.setItem("consultor_metas", JSON.stringify(metas));
      localStorage.setItem("consultor_banco", JSON.stringify(banco));
      localStorage.setItem("consultor_preferencias", JSON.stringify(preferencias));
      
      setMensagem("Configurações salvas com sucesso! ✅");
      setTimeout(() => setMensagem(""), 3000);
    } catch (error) {
      setMensagem("Erro ao salvar configurações ❌");
    } finally {
      setSalvando(false);
    }
  };

  // Adicionar novo valor
  const adicionarValor = () => {
    if (institucional.novoValor.trim()) {
      setInstitucional({
        ...institucional,
        valores: [...institucional.valores, institucional.novoValor.trim()],
        novoValor: ""
      });
    }
  };

  // Remover valor
  const removerValor = (index) => {
    const novosValores = institucional.valores.filter((_, i) => i !== index);
    setInstitucional({ ...institucional, valores: novosValores });
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ color: coresConsultor.primary, marginBottom: "5px" }}>
          ⚙️ Configurações
        </h2>
        <p style={{ color: "#666" }}>
          Gerencie suas informações pessoais e preferências do sistema
        </p>
      </div>

      {/* Abas de navegação */}
      <div style={{
        display: "flex",
        gap: "5px",
        borderBottom: "2px solid #e5e7eb",
        marginBottom: "25px",
        flexWrap: "wrap"
      }}>
        {[
          { id: "perfil", nome: "👤 Perfil" },
          { id: "institucional", nome: "📌 Institucional" },
          { id: "metas", nome: "🎯 Metas" },
          { id: "financeiro", nome: "💰 Financeiro" },
          { id: "preferencias", nome: "⚙️ Preferências" }
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: abaAtiva === aba.id ? coresConsultor.primary : "#666",
              border: "none",
              borderBottom: abaAtiva === aba.id ? `3px solid ${coresConsultor.primary}` : "3px solid transparent",
              cursor: "pointer",
              fontWeight: abaAtiva === aba.id ? "600" : "400",
              fontSize: "14px"
            }}
          >
            {aba.nome}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div style={{
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>

        {/* ABA 1 - PERFIL */}
        {abaAtiva === "perfil" && (
          <div>
            <h3 style={{ color: coresConsultor.primary, marginBottom: "20px" }}>
              👤 Meu Perfil
            </h3>

            {/* Foto (placeholder) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "25px",
              flexWrap: "wrap"
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: `${coresConsultor.accent}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                color: coresConsultor.accent
              }}>
                {perfil.nome.charAt(0)}
              </div>
              <div>
                <button style={botaoSecundario}>
                  📷 Alterar foto
                </button>
                <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                  JPG, PNG ou GIF. Máx 2MB.
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px"
            }}>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input
                  type="text"
                  value={perfil.nome}
                  onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input
                  type="email"
                  value={perfil.email}
                  onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input
                  type="text"
                  value={perfil.telefone}
                  onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Cargo</label>
                <input
                  type="text"
                  value={perfil.cargo}
                  onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Empresa</label>
                <input
                  type="text"
                  value={perfil.empresa}
                  onChange={(e) => setPerfil({ ...perfil, empresa: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 2 - INSTITUCIONAL */}
        {abaAtiva === "institucional" && (
          <div>
            <h3 style={{ color: coresConsultor.primary, marginBottom: "20px" }}>
              📌 Missão, Visão e Valores
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Missão</label>
              <textarea
                value={institucional.missao}
                onChange={(e) => setInstitucional({ ...institucional, missao: e.target.value })}
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Visão</label>
              <textarea
                value={institucional.visao}
                onChange={(e) => setInstitucional({ ...institucional, visao: e.target.value })}
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Valores</label>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "15px"
              }}>
                {institucional.valores.map((valor, index) => (
                  <span
                    key={index}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: `${coresConsultor.accent}20`,
                      color: coresConsultor.accent,
                      borderRadius: "20px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    {valor}
                    <button
                      onClick={() => removerValor(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: coresConsultor.danger,
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "0"
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={institucional.novoValor}
                  onChange={(e) => setInstitucional({ ...institucional, novoValor: e.target.value })}
                  placeholder="Novo valor"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={adicionarValor}
                  style={botaoSecundario}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3 - METAS */}
        {abaAtiva === "metas" && (
          <div>
            <h3 style={{ color: coresConsultor.primary, marginBottom: "20px" }}>
              🎯 Metas do Ano
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px"
            }}>
              <div>
                <label style={labelStyle}>Meta de Faturamento (R$)</label>
                <input
                  type="number"
                  value={metas.faturamentoAnual}
                  onChange={(e) => setMetas({ ...metas, faturamentoAnual: parseFloat(e.target.value) })}
                  style={inputStyle}
                  step="10000"
                />
              </div>
              <div>
                <label style={labelStyle}>Novos Clientes</label>
                <input
                  type="number"
                  value={metas.novosClientes}
                  onChange={(e) => setMetas({ ...metas, novosClientes: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Meta de Satisfação (0-5)</label>
                <input
                  type="number"
                  value={metas.satisfacao}
                  onChange={(e) => setMetas({ ...metas, satisfacao: parseFloat(e.target.value) })}
                  style={inputStyle}
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
              <div>
                <label style={labelStyle}>Horas de Consultoria</label>
                <input
                  type="number"
                  value={metas.horasConsultoria}
                  onChange={(e) => setMetas({ ...metas, horasConsultoria: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Projetos por Ano</label>
                <input
                  type="number"
                  value={metas.projetosAnuais}
                  onChange={(e) => setMetas({ ...metas, projetosAnuais: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 4 - FINANCEIRO */}
        {abaAtiva === "financeiro" && (
          <div>
            <h3 style={{ color: coresConsultor.primary, marginBottom: "20px" }}>
              💰 Dados Bancários
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px"
            }}>
              <div>
                <label style={labelStyle}>Banco</label>
                <select
                  value={banco.banco}
                  onChange={(e) => setBanco({ ...banco, banco: e.target.value })}
                  style={inputStyle}
                >
                  <option>Banco do Brasil</option>
                  <option>Caixa Econômica</option>
                  <option>Itaú</option>
                  <option>Bradesco</option>
                  <option>Santander</option>
                  <option>Nubank</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Agência</label>
                <input
                  type="text"
                  value={banco.agencia}
                  onChange={(e) => setBanco({ ...banco, agencia: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Conta</label>
                <input
                  type="text"
                  value={banco.conta}
                  onChange={(e) => setBanco({ ...banco, conta: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tipo de Conta</label>
                <select
                  value={banco.tipo}
                  onChange={(e) => setBanco({ ...banco, tipo: e.target.value })}
                  style={inputStyle}
                >
                  <option>Corrente</option>
                  <option>Poupança</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo de Chave PIX</label>
                <select
                  value={banco.chavePix}
                  onChange={(e) => setBanco({ ...banco, chavePix: e.target.value })}
                  style={inputStyle}
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="celular">Celular</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Chave PIX</label>
                <input
                  type="text"
                  value={banco.pix}
                  onChange={(e) => setBanco({ ...banco, pix: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 5 - PREFERÊNCIAS */}
        {abaAtiva === "preferencias" && (
          <div>
            <h3 style={{ color: coresConsultor.primary, marginBottom: "20px" }}>
              ⚙️ Preferências do Sistema
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Tema</label>
                <select
                  value={preferencias.tema}
                  onChange={(e) => setPreferencias({ ...preferencias, tema: e.target.value })}
                  style={inputStyle}
                >
                  <option value="claro">Claro</option>
                  <option value="escuro">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Idioma</label>
                <select
                  value={preferencias.idioma}
                  onChange={(e) => setPreferencias({ ...preferencias, idioma: e.target.value })}
                  style={inputStyle}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={preferencias.notificacoes}
                  onChange={(e) => setPreferencias({ ...preferencias, notificacoes: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <label>Receber notificações por e-mail</label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={preferencias.relatoriosAutomaticos}
                  onChange={(e) => setPreferencias({ ...preferencias, relatoriosAutomaticos: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <label>Gerar relatórios automáticos</label>
              </div>

              {preferencias.relatoriosAutomaticos && (
                <div>
                  <label style={labelStyle}>Frequência dos relatórios</label>
                  <select
                    value={preferencias.frequenciaRelatorios}
                    onChange={(e) => setPreferencias({ ...preferencias, frequenciaRelatorios: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div style={{
          display: "flex",
          gap: "15px",
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
          flexWrap: "wrap"
        }}>
          <Botao
            variant="primary"
            size="md"
            onClick={salvarDados}
            loading={salvando}
            disabled={salvando}
          >
            Salvar configurações
          </Botao>
          <Botao
            variant="secondary"
            size="md"
            onClick={() => {
              setPerfil({});
              setInstitucional({});
              setMetas({});
              setBanco({});
              setPreferencias({});
            }}
          >
            Cancelar
          </Botao>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <p style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: mensagem.includes("✅") ? "#16a34a20" : "#dc262620",
            color: mensagem.includes("✅") ? "#16a34a" : "#dc2626",
            borderRadius: "4px",
            textAlign: "center"
          }}>
            {mensagem}
          </p>
        )}
      </div>

      {/* Preview (opcional) */}
      {abaAtiva === "institucional" && (
        <div style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h4 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
            👁️ Preview - Como aparece no Dashboard
          </h4>
          <div style={{ fontSize: "13px", color: "#374151" }}>
            <p><strong>Missão:</strong> {institucional.missao}</p>
            <p><strong>Visão:</strong> {institucional.visao}</p>
            <p><strong>Valores:</strong> {institucional.valores.join(" • ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos reutilizáveis
const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box"
};

const botaoSecundario = {
  padding: "8px 16px",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer"
};