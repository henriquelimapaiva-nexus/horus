// src/pages/SPC.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Componentes de gráficos
import GraficoLinha from "../components/graficos/GraficoLinha";
import GraficoBarras from "../components/graficos/GraficoBarras";
import { coresNexus } from "../components/graficos/GraficoBase";

// Função auxiliar para formatar data sem timezone
const formatarData = (dataString) => {
  if (!dataString) return "-";
  if (dataString.includes('-') && dataString.length === 10) {
    return dataString.split('-').reverse().join('/');
  }
  const dataParte = dataString.split('T')[0];
  return dataParte.split('-').reverse().join('/');
};

// Estilos específicos para a tabela Top 5 Defeitos
const thDefeitos = {
  padding: "12px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: "600"
};

const thNumero = {
  ...thDefeitos,
  textAlign: "right"
};

const tdDefeitos = {
  padding: "12px",
  textAlign: "left",
  fontSize: "13px"
};

const tdNumero = {
  ...tdDefeitos,
  textAlign: "right"
};

export default function SPC() {
  const { clienteAtual } = useOutletContext();

  // Estados
  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [postos, setPostos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [defeitos, setDefeitos] = useState([]);
  const [medicoesDimensionais, setMedicoesDimensionais] = useState([]);
  const [editId, setEditId] = useState(null);
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: "",
    postoId: "",
    produtoId: "",
    dataInicio: "",
    dataFim: ""
  });

  // Formulário temporário para defeitos
  const [defeitoTemp, setDefeitoTemp] = useState({
    posto_id: "",
    produto_id: "",
    tipo_defeito: "",
    quantidade: "",
    turno: "",
    data: "",
    descricao: "",
    acao_imediata: ""
  });

  // Lista de defeitos pendentes
  const [listaDefeitos, setListaDefeitos] = useState([]);

  // Formulário temporário para medições
  const [medicaoTemp, setMedicaoTemp] = useState({
    posto_id: "",
    produto_id: "",
    caracteristica: "",
    valor_medido: "",
    limite_inferior: "",
    limite_superior: "",
    unidade: "",
    turno: "",
    data: ""
  });

  // Lista de medições pendentes
  const [listaMedicoes, setListaMedicoes] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("defeitos");

  // Carregar empresas
  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => console.error("Erro ao carregar empresas:", err));
  }, []);

  // Carregar linhas
  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/lines/${filtros.empresaId}`)
        .then(res => setLinhas(res.data))
        .catch(err => console.error("Erro ao carregar linhas:", err));
    }
  }, [filtros.empresaId]);

  // Carregar postos
  useEffect(() => {
    if (filtros.linhaId) {
      api.get(`/work-stations/${filtros.linhaId}`)
        .then(res => setPostos(res.data))
        .catch(err => console.error("Erro ao carregar postos:", err));
    }
  }, [filtros.linhaId]);

  // Carregar produtos
  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/products/company/${filtros.empresaId}`)
        .then(res => setProdutos(res.data))
        .catch(err => console.error("Erro ao carregar produtos:", err));
    }
  }, [filtros.empresaId]);

  // Carregar defeitos e medições
  useEffect(() => {
    if (filtros.linhaId && filtros.dataInicio && filtros.dataFim) {
      carregarDefeitos();
      carregarMedicoesDimensionais();
    }
  }, [filtros.linhaId, filtros.dataInicio, filtros.dataFim, filtros.postoId, filtros.produtoId]);

  async function carregarDefeitos() {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim);
      if (filtros.postoId) params.append('posto_id', filtros.postoId);
      if (filtros.produtoId) params.append('produto_id', filtros.produtoId);
      
      const res = await api.get(`/qualidade/defeitos/linha/${filtros.linhaId}?${params}`);
      setDefeitos(res.data);
      calcularEstatisticasDefeitos(res.data);
    } catch (error) {
      console.error("Erro ao carregar defeitos:", error);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarMedicoesDimensionais() {
    try {
      const params = new URLSearchParams();
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim);
      if (filtros.postoId) params.append('posto_id', filtros.postoId);
      if (filtros.produtoId) params.append('produto_id', filtros.produtoId);
      
      const res = await api.get(`/qualidade/medicoes/linha/${filtros.linhaId}?${params}`);
      setMedicoesDimensionais(res.data);
      calcularEstatisticasMedicoes(res.data);
    } catch (error) {
      console.error("Erro ao carregar medições:", error);
    }
  }

  const [estatisticasDefeitos, setEstatisticasDefeitos] = useState(null);
  const [estatisticasMedicoes, setEstatisticasMedicoes] = useState(null);

  function calcularEstatisticasDefeitos(dados) {
    if (dados.length === 0) {
      setEstatisticasDefeitos(null);
      return;
    }

    const totalDefeitos = dados.reduce((sum, d) => sum + (d.quantidade || 0), 0);
    const defeitosPorTipo = {};
    
    dados.forEach(d => {
      const tipo = d.tipo_defeito;
      defeitosPorTipo[tipo] = (defeitosPorTipo[tipo] || 0) + (d.quantidade || 0);
    });

    const principaisDefeitos = Object.entries(defeitosPorTipo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setEstatisticasDefeitos({
      total: totalDefeitos,
      porTipo: defeitosPorTipo,
      principais: principaisDefeitos
    });
  }

  function calcularEstatisticasMedicoes(dados) {
    if (dados.length === 0) {
      setEstatisticasMedicoes(null);
      return;
    }

    const valores = dados.map(m => parseFloat(m.valor_medido)).filter(v => !isNaN(v));
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    
    const variancia = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variancia);
    const cpk = calcularCPK(valores, dados[0]?.limite_inferior, dados[0]?.limite_superior);

    setEstatisticasMedicoes({
      total: dados.length,
      media: media.toFixed(3),
      minimo: minimo.toFixed(3),
      maximo: maximo.toFixed(3),
      desvio: desvio.toFixed(3),
      cpk: cpk
    });
  }

  function calcularCPK(valores, LIE, LSE) {
    if (!LIE && !LSE) return null;
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length);
    
    const cpkL = LIE ? (media - LIE) / (3 * desvio) : Infinity;
    const cpkU = LSE ? (LSE - media) / (3 * desvio) : Infinity;
    return Math.min(cpkL, cpkU).toFixed(2);
  }

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const handleDefeitoTempChange = (e) => {
    setDefeitoTemp({
      ...defeitoTemp,
      [e.target.name]: e.target.value
    });
  };

  const handleMedicaoTempChange = (e) => {
    setMedicaoTemp({
      ...medicaoTemp,
      [e.target.name]: e.target.value
    });
  };

  // Adicionar defeito à lista
  const adicionarDefeitoLista = () => {
    if (!defeitoTemp.posto_id || !defeitoTemp.produto_id || !defeitoTemp.tipo_defeito || !defeitoTemp.quantidade || !defeitoTemp.turno || !defeitoTemp.data) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setListaDefeitos([...listaDefeitos, { ...defeitoTemp, id: Date.now() }]);
    
    setDefeitoTemp({
      posto_id: "",
      produto_id: "",
      tipo_defeito: "",
      quantidade: "",
      turno: "",
      data: "",
      descricao: "",
      acao_imediata: ""
    });
    
    toast.success("Defeito adicionado à lista!");
  };

  // Adicionar medição à lista
  const adicionarMedicaoLista = () => {
    if (!medicaoTemp.posto_id || !medicaoTemp.produto_id || !medicaoTemp.caracteristica || !medicaoTemp.valor_medido || !medicaoTemp.turno || !medicaoTemp.data) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setListaMedicoes([...listaMedicoes, { ...medicaoTemp, id: Date.now() }]);
    
    setMedicaoTemp({
      posto_id: "",
      produto_id: "",
      caracteristica: "",
      valor_medido: "",
      limite_inferior: "",
      limite_superior: "",
      unidade: "",
      turno: "",
      data: ""
    });
    
    toast.success("Medição adicionada à lista!");
  };

  // Remover defeito da lista
  const removerDefeitoLista = (id) => {
    setListaDefeitos(listaDefeitos.filter(item => item.id !== id));
  };

  // Remover medição da lista
  const removerMedicaoLista = (id) => {
    setListaMedicoes(listaMedicoes.filter(item => item.id !== id));
  };

  // Enviar todos os defeitos
  async function enviarTodosDefeitos() {
    if (listaDefeitos.length === 0) {
      toast.error("Nenhum defeito para enviar");
      return;
    }

    setSalvando(true);
    let sucessos = 0;
    let erros = 0;

    for (const defeito of listaDefeitos) {
      try {
        await api.post("/qualidade/defeitos", {
          posto_id: parseInt(defeito.posto_id),
          produto_id: parseInt(defeito.produto_id),
          tipo_defeito: defeito.tipo_defeito,
          quantidade: parseInt(defeito.quantidade),
          turno: parseInt(defeito.turno),
          data: defeito.data,
          descricao: defeito.descricao || null,
          acao_imediata: defeito.acao_imediata || null
        });
        sucessos++;
      } catch (error) {
        console.error("Erro ao salvar defeito:", error);
        erros++;
      }
    }

    if (erros === 0) {
      toast.success(`${sucessos} defeitos registrados com sucesso! ✅`);
    } else {
      toast.warning(`${sucessos} registrados, ${erros} falhas ❌`);
    }

    setListaDefeitos([]);
    carregarDefeitos();
    setSalvando(false);
  }

  // Enviar todas as medições
  async function enviarTodasMedicoes() {
    if (listaMedicoes.length === 0) {
      toast.error("Nenhuma medição para enviar");
      return;
    }

    setSalvando(true);
    let sucessos = 0;
    let erros = 0;

    for (const medicao of listaMedicoes) {
      try {
        await api.post("/qualidade/medicoes", {
          posto_id: parseInt(medicao.posto_id),
          produto_id: parseInt(medicao.produto_id),
          caracteristica: medicao.caracteristica,
          valor_medido: parseFloat(medicao.valor_medido),
          limite_inferior: medicao.limite_inferior ? parseFloat(medicao.limite_inferior) : null,
          limite_superior: medicao.limite_superior ? parseFloat(medicao.limite_superior) : null,
          unidade: medicao.unidade,
          turno: parseInt(medicao.turno),
          data: medicao.data
        });
        sucessos++;
      } catch (error) {
        console.error("Erro ao salvar medição:", error);
        erros++;
      }
    }

    if (erros === 0) {
      toast.success(`${sucessos} medições registradas com sucesso! ✅`);
    } else {
      toast.warning(`${sucessos} registradas, ${erros} falhas ❌`);
    }

    setListaMedicoes([]);
    carregarMedicoesDimensionais();
    setSalvando(false);
  }

  // Limpar lista
  const limparListaDefeitos = () => {
    if (window.confirm("Deseja limpar toda a lista de defeitos pendentes?")) {
      setListaDefeitos([]);
    }
  };

  const limparListaMedicoes = () => {
    if (window.confirm("Deseja limpar toda a lista de medições pendentes?")) {
      setListaMedicoes([]);
    }
  };

  async function handleDelete(id, tipo) {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    
    setCarregando(true);
    try {
      if (tipo === "defeito") {
        await api.delete(`/qualidade/defeitos/${id}`);
        toast.success("Defeito excluído com sucesso ✅");
        carregarDefeitos();
      } else {
        await api.delete(`/qualidade/medicoes/${id}`);
        toast.success("Medição excluída com sucesso ✅");
        carregarMedicoesDimensionais();
      }
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro ❌");
    } finally {
      setCarregando(false);
    }
  }

  function handleEditDefeito(defeito) {
    setEditId(defeito.id);
    setDefeitoTemp({
      posto_id: defeito.posto_id.toString(),
      produto_id: defeito.produto_id.toString(),
      tipo_defeito: defeito.tipo_defeito,
      quantidade: defeito.quantidade,
      turno: defeito.turno.toString(),
      data: defeito.data ? defeito.data.split('T')[0] : "",
      descricao: defeito.descricao || "",
      acao_imediata: defeito.acao_imediata || ""
    });
    setAbaAtiva("defeitos");
    document.getElementById('formulario-defeitos')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleEditMedicao(medicao) {
    setEditId(medicao.id);
    setMedicaoTemp({
      posto_id: medicao.posto_id.toString(),
      produto_id: medicao.produto_id.toString(),
      caracteristica: medicao.caracteristica,
      valor_medido: medicao.valor_medido,
      limite_inferior: medicao.limite_inferior || "",
      limite_superior: medicao.limite_superior || "",
      unidade: medicao.unidade || "",
      turno: medicao.turno.toString(),
      data: medicao.data ? medicao.data.split('T')[0] : ""
    });
    setAbaAtiva("dimensional");
    document.getElementById('formulario-medicoes')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditId(null);
    setDefeitoTemp({
      posto_id: "",
      produto_id: "",
      tipo_defeito: "",
      quantidade: "",
      turno: "",
      data: "",
      descricao: "",
      acao_imediata: ""
    });
    setMedicaoTemp({
      posto_id: "",
      produto_id: "",
      caracteristica: "",
      valor_medido: "",
      limite_inferior: "",
      limite_superior: "",
      unidade: "",
      turno: "",
      data: ""
    });
    setListaDefeitos([]);
    setListaMedicoes([]);
  }

  const getTipoDefeitoNome = (codigo) => {
    return codigo; // Agora é texto livre, retorna o próprio valor
  };

  const getPostoNome = (id) => {
    const posto = postos.find(p => p.id === id);
    return posto ? posto.nome : `Posto ${id}`;
  };

  const getProdutoNome = (id) => {
    const produto = produtos.find(p => p.id === id);
    return produto ? produto.nome : `Produto ${id}`;
  };

  if (!filtros.empresaId) {
    return (
      <div style={{ padding: "clamp(20px, 5vw, 60px)", textAlign: "center" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", maxWidth: "500px", margin: "0 auto" }}>
          <h2 style={{ color: "#1E3A8A" }}>Selecione uma empresa</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>Escolha uma empresa para iniciar o controle de qualidade.</p>
          <select
            value={filtros.empresaId}
            onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })}
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", width: "100%" }}
          >
            <option value="">Selecione uma empresa...</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)"
      }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "clamp(20px, 4vw, 28px)" }}>
          SPC - Controle Estatístico de Processo
        </h1>
        <p style={{ color: "#666", fontSize: "clamp(12px, 2vw, 14px)" }}>
          Registre defeitos e medições dimensionais para controle de qualidade
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)"
      }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>Filtros</h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "15px" 
        }}>
          <div>
            <label style={labelStyle}>Empresa</label>
            <select
              name="empresaId"
              value={filtros.empresaId}
              onChange={handleFiltroChange}
              style={inputStyle}
            >
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Linha</label>
            <select
              name="linhaId"
              value={filtros.linhaId}
              onChange={handleFiltroChange}
              style={inputStyle}
              disabled={!filtros.empresaId}
            >
              <option value="">Selecione a linha</option>
              {linhas.map(linha => (
                <option key={linha.id} value={linha.id}>{linha.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Posto</label>
            <select
              name="postoId"
              value={filtros.postoId}
              onChange={handleFiltroChange}
              style={inputStyle}
              disabled={!filtros.linhaId}
            >
              <option value="">Selecione o posto</option>
              {postos.map(posto => (
                <option key={posto.id} value={posto.id}>{posto.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Produto</label>
            <select
              name="produtoId"
              value={filtros.produtoId}
              onChange={handleFiltroChange}
              style={inputStyle}
            >
              <option value="">Selecione o produto</option>
              {produtos.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data Início</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Data Fim</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "20px",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <button
          onClick={() => {
            setAbaAtiva("defeitos");
            handleCancelEdit();
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: abaAtiva === "defeitos" ? "#1E3A8A" : "transparent",
            color: abaAtiva === "defeitos" ? "white" : "#1E3A8A",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          📊 Registro de Defeitos
        </button>
        <button
          onClick={() => {
            setAbaAtiva("dimensional");
            handleCancelEdit();
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: abaAtiva === "dimensional" ? "#1E3A8A" : "transparent",
            color: abaAtiva === "dimensional" ? "white" : "#1E3A8A",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          📏 Medições Dimensionais
        </button>
      </div>

      {/* ABA: DEFEITOS */}
      {abaAtiva === "defeitos" && (
        <>
          {/* Formulário de Defeitos */}
          <div 
            id="formulario-defeitos"
            style={{ 
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "30px"
            }}
          >
            <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>
              {editId ? "✏️ Editar Defeito" : "📊 Adicionar Defeito à Lista"}
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "15px",
              marginBottom: "15px"
            }}>
              <div>
                <label style={labelStyle}>Posto *</label>
                <select
                  name="posto_id"
                  value={defeitoTemp.posto_id}
                  onChange={handleDefeitoTempChange}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {postos.map(posto => (
                    <option key={posto.id} value={posto.id}>{posto.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Produto *</label>
                <select
                  name="produto_id"
                  value={defeitoTemp.produto_id}
                  onChange={handleDefeitoTempChange}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {produtos.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tipo de Defeito *</label>
                <input
                  type="text"
                  name="tipo_defeito"
                  value={defeitoTemp.tipo_defeito}
                  onChange={handleDefeitoTempChange}
                  style={inputStyle}
                  placeholder="Ex: Defeito Dimensional, Impureza, Cor fora do padrão..."
                />
              </div>

              <div>
                <label style={labelStyle}>Quantidade *</label>
                <input
                  type="number"
                  name="quantidade"
                  value={defeitoTemp.quantidade}
                  onChange={handleDefeitoTempChange}
                  style={inputStyle}
                  placeholder="Número de peças"
                  min="1"
                />
              </div>

              <div>
                <label style={labelStyle}>Turno *</label>
                <select
                  name="turno"
                  value={defeitoTemp.turno}
                  onChange={handleDefeitoTempChange}
                  style={inputStyle}
                >
                  <option value="">Selecione o turno</option>
                  <option value="1">1º Turno</option>
                  <option value="2">2º Turno</option>
                  <option value="3">3º Turno</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Data *</label>
                <input
                  type="date"
                  name="data"
                  value={defeitoTemp.data}
                  onChange={handleDefeitoTempChange}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyle}>Descrição</label>
              <input
                type="text"
                name="descricao"
                value={defeitoTemp.descricao}
                onChange={handleDefeitoTempChange}
                style={inputStyle}
                placeholder="Descreva o defeito..."
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyle}>Ação Imediata</label>
              <input
                type="text"
                name="acao_imediata"
                value={defeitoTemp.acao_imediata}
                onChange={handleDefeitoTempChange}
                style={inputStyle}
                placeholder="O que foi feito imediatamente?"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Botao
                variant="primary"
                size="md"
                onClick={adicionarDefeitoLista}
                disabled={salvando}
              >
                + Adicionar à Lista
              </Botao>
              {editId && (
                <Botao
                  variant="secondary"
                  size="md"
                  onClick={handleCancelEdit}
                >
                  Cancelar Edição
                </Botao>
              )}
            </div>
          </div>

          {/* Lista de Defeitos Pendentes */}
          {listaDefeitos.length > 0 && (
            <div style={{ 
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "30px",
              border: "2px solid #f59e0b"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ color: "#f59e0b", margin: 0 }}>📋 Defeitos Pendentes ({listaDefeitos.length})</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Botao variant="secondary" size="sm" onClick={limparListaDefeitos}>
                    Limpar Lista
                  </Botao>
                  <Botao variant="success" size="sm" onClick={enviarTodosDefeitos} loading={salvando}>
                    Enviar Todos ({listaDefeitos.length})
                  </Botao>
                </div>
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fef3c7" }}>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Posto</th>
                      <th style={thStyle}>Produto</th>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Qtd</th>
                      <th style={thStyle}>Turno</th>
                      <th style={thStyle}>Ações</th>
                       </tr>
                  </thead>
                  <tbody>
                    {listaDefeitos.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{formatarData(item.data)}</td>
                        <td style={tdStyle}>{getPostoNome(parseInt(item.posto_id))}</td>
                        <td style={tdStyle}>{getProdutoNome(parseInt(item.produto_id))}</td>
                        <td style={tdStyle}>{item.tipo_defeito}</td>
                        <td style={tdStyle}>{item.quantidade}</td>
                        <td style={tdStyle}>{item.turno}º</td>
                        <td style={tdStyle}>
                          <Botao variant="danger" size="xs" onClick={() => removerDefeitoLista(item.id)}>
                            Remover
                          </Botao>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estatísticas de Defeitos */}
          {estatisticasDefeitos && estatisticasDefeitos.total > 0 && (
            <div style={{ 
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "30px"
            }}>
              <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📈 Análise de Defeitos</h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                gap: "15px",
                marginBottom: "20px"
              }}>
                <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#666" }}>TOTAL DE DEFEITOS</div>
                  <div style={{ fontSize: "28px", fontWeight: "bold", color: "#dc2626" }}>{estatisticasDefeitos.total}</div>
                </div>
              </div>

              <h4 style={{ marginBottom: "10px" }}>Top 5 Defeitos Mais Comuns</h4>
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                      <th style={{ ...thDefeitos, width: "50%" }}>Tipo</th>
                      <th style={{ ...thNumero, width: "25%" }}>Quantidade</th>
                      <th style={{ ...thNumero, width: "25%" }}>Percentual</th>
                      </tr>
                  </thead>
                  <tbody>
                    {estatisticasDefeitos.principais.map(([tipo, qtd]) => (
                      <tr key={tipo} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdDefeitos}>{tipo}</td>
                        <td style={tdNumero}>{qtd}</td>
                        <td style={tdNumero}>
                          {((qtd / estatisticasDefeitos.total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Histórico de Defeitos */}
          <div style={{ 
            backgroundColor: "white", 
            padding: "20px", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📋 Histórico de Defeitos</h3>
            
            {carregando ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Carregando...</div>
            ) : defeitos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Nenhum defeito registrado no período.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Posto</th>
                      <th style={thStyle}>Produto</th>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Qtd</th>
                      <th style={thStyle}>Turno</th>
                      <th style={thStyle}>Ação Imediata</th>
                      <th style={thStyle}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defeitos.map((d, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{formatarData(d.data)}</td>
                        <td style={tdStyle}>{getPostoNome(d.posto_id)}</td>
                        <td style={tdStyle}>{getProdutoNome(d.produto_id)}</td>
                        <td style={tdStyle}>{d.tipo_defeito}</td>
                        <td style={tdStyle}>{d.quantidade}</td>
                        <td style={tdStyle}>{d.turno}º</td>
                        <td style={tdStyle}>{d.acao_imediata || "-"}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                            <Botao
                              variant="primary"
                              size="xs"
                              onClick={() => handleEditDefeito(d)}
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Editar
                            </Botao>
                            <Botao
                              variant="danger"
                              size="xs"
                              onClick={() => handleDelete(d.id, "defeito")}
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Excluir
                            </Botao>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ABA: MEDIÇÕES DIMENSIONAIS */}
      {abaAtiva === "dimensional" && (
        <>
          {/* Formulário de Medições */}
          <div 
            id="formulario-medicoes"
            style={{ 
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "30px"
            }}
          >
            <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>
              {editId ? "✏️ Editar Medição" : "📏 Adicionar Medição à Lista"}
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "15px",
              marginBottom: "15px"
            }}>
              <div>
                <label style={labelStyle}>Posto *</label>
                <select
                  name="posto_id"
                  value={medicaoTemp.posto_id}
                  onChange={handleMedicaoTempChange}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {postos.map(posto => (
                    <option key={posto.id} value={posto.id}>{posto.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Produto *</label>
                <select
                  name="produto_id"
                  value={medicaoTemp.produto_id}
                  onChange={handleMedicaoTempChange}
                  style={inputStyle}
                >
                  <option value="">Selecione</option>
                  {produtos.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Característica *</label>
                <input
                  type="text"
                  name="caracteristica"
                  value={medicaoTemp.caracteristica}
                  onChange={handleMedicaoTempChange}
                  style={inputStyle}
                  placeholder="Ex: Diâmetro externo, pH, Viscosidade, Temperatura..."
                />
              </div>

              <div>
                <label style={labelStyle}>Valor Medido *</label>
                <input
                  type="number"
                  name="valor_medido"
                  value={medicaoTemp.valor_medido}
                  onChange={handleMedicaoTempChange}
                  step="0.001"
                  style={inputStyle}
                  placeholder="Valor medido"
                />
              </div>

              <div>
                <label style={labelStyle}>Limite Inferior (LIE)</label>
                <input
                  type="number"
                  name="limite_inferior"
                  value={medicaoTemp.limite_inferior}
                  onChange={handleMedicaoTempChange}
                  step="0.001"
                  style={inputStyle}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label style={labelStyle}>Limite Superior (LSE)</label>
                <input
                  type="number"
                  name="limite_superior"
                  value={medicaoTemp.limite_superior}
                  onChange={handleMedicaoTempChange}
                  step="0.001"
                  style={inputStyle}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label style={labelStyle}>Unidade *</label>
                <input
                  type="text"
                  name="unidade"
                  value={medicaoTemp.unidade}
                  onChange={handleMedicaoTempChange}
                  style={inputStyle}
                  placeholder="Ex: mm, cm, °C, pH, cP, %..."
                />
              </div>

              <div>
                <label style={labelStyle}>Turno *</label>
                <select
                  name="turno"
                  value={medicaoTemp.turno}
                  onChange={handleMedicaoTempChange}
                  style={inputStyle}
                >
                  <option value="">Selecione o turno</option>
                  <option value="1">1º Turno</option>
                  <option value="2">2º Turno</option>
                  <option value="3">3º Turno</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Data *</label>
                <input
                  type="date"
                  name="data"
                  value={medicaoTemp.data}
                  onChange={handleMedicaoTempChange}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {editId ? (
                <>
                  <Botao
                    variant="success"
                    size="md"
                    onClick={salvarMedicao}
                    loading={salvando}
                    disabled={salvando}
                  >
                    💾 Salvar Edição
                  </Botao>
                  <Botao
                    variant="secondary"
                    size="md"
                    onClick={handleCancelEdit}
                  >
                    Cancelar Edição
                  </Botao>
                </>
              ) : (
                <Botao
                  variant="primary"
                  size="md"
                  onClick={adicionarMedicaoLista}
                  disabled={salvando}
                >
                  + Adicionar à Lista
                </Botao>
              )}
            </div>
          </div>

          {/* Lista de Medições Pendentes */}
          {listaMedicoes.length > 0 && (
            <div style={{ 
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "30px",
              border: "2px solid #f59e0b"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ color: "#f59e0b", margin: 0 }}>📏 Medições Pendentes ({listaMedicoes.length})</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Botao variant="secondary" size="sm" onClick={limparListaMedicoes}>
                    Limpar Lista
                  </Botao>
                  <Botao variant="success" size="sm" onClick={enviarTodasMedicoes} loading={salvando}>
                    Enviar Todas ({listaMedicoes.length})
                  </Botao>
                </div>
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fef3c7" }}>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Posto</th>
                      <th style={thStyle}>Produto</th>
                      <th style={thStyle}>Característica</th>
                      <th style={thStyle}>Valor</th>
                      <th style={thStyle}>Turno</th>
                      <th style={thStyle}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaMedicoes.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{formatarData(item.data)}</td>
                        <td style={tdStyle}>{getPostoNome(parseInt(item.posto_id))}</td>
                        <td style={tdStyle}>{getProdutoNome(parseInt(item.produto_id))}</td>
                        <td style={tdStyle}>{item.caracteristica}</td>
                        <td style={tdStyle}>{item.valor_medido} {item.unidade}</td>
                        <td style={tdStyle}>{item.turno}º</td>
                        <td style={tdStyle}>
                          <Botao variant="danger" size="xs" onClick={() => removerMedicaoLista(item.id)}>
                            Remover
                          </Botao>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estatísticas de Medições */}
          {estatisticasMedicoes && estatisticasMedicoes.total > 0 && (
            <div style={{ 
              backgroundColor: "white", 
              padding: "20px", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "30px"
            }}>
              <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📊 Análise Estatística</h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
                gap: "15px"
              }}>
                <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>AMOSTRAS</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1E3A8A" }}>{estatisticasMedicoes.total}</div>
                </div>
                <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>MÉDIA</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a" }}>{estatisticasMedicoes.media}</div>
                </div>
                <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>MIN / MAX</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>{estatisticasMedicoes.minimo} / {estatisticasMedicoes.maximo}</div>
                </div>
                <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>DESVIO PADRÃO</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#f59e0b" }}>{estatisticasMedicoes.desvio}</div>
                </div>
                {estatisticasMedicoes.cpk && (
                  <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#666" }}>Cpk</div>
                    <div style={{ 
                      fontSize: "20px", 
                      fontWeight: "bold", 
                      color: parseFloat(estatisticasMedicoes.cpk) >= 1.33 ? "#16a34a" : "#dc2626" 
                    }}>
                      {estatisticasMedicoes.cpk}
                    </div>
                    <div style={{ fontSize: "10px", color: "#666" }}>
                      {parseFloat(estatisticasMedicoes.cpk) >= 1.33 ? "Processo capaz" : "Processo precisa melhorar"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Histórico de Medições */}
          <div style={{ 
            backgroundColor: "white", 
            padding: "20px", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📋 Histórico de Medições</h3>
            
            {medicoesDimensionais.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Nenhuma medição registrada no período.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Posto</th>
                      <th style={thStyle}>Produto</th>
                      <th style={thStyle}>Característica</th>
                      <th style={thStyle}>Valor</th>
                      <th style={thStyle}>LIE</th>
                      <th style={thStyle}>LSE</th>
                      <th style={thStyle}>Turno</th>
                      <th style={thStyle}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicoesDimensionais.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdStyle}>{formatarData(m.data)}</td>
                        <td style={tdStyle}>{getPostoNome(m.posto_id)}</td>
                        <td style={tdStyle}>{getProdutoNome(m.produto_id)}</td>
                        <td style={tdStyle}>{m.caracteristica}</td>
                        <td style={tdStyle}>
                          <span style={{
                            fontWeight: "bold",
                            color: (m.limite_inferior && m.valor_medido < m.limite_inferior) || (m.limite_superior && m.valor_medido > m.limite_superior) 
                              ? "#dc2626" : "#16a34a"
                          }}>
                            {m.valor_medido} {m.unidade}
                          </span>
                        </td>
                        <td style={tdStyle}>{m.limite_inferior || "-"} {m.limite_inferior && m.unidade}</td>
                        <td style={tdStyle}>{m.limite_superior || "-"} {m.limite_superior && m.unidade}</td>
                        <td style={tdStyle}>{m.turno}º</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                            <Botao
                              variant="primary"
                              size="xs"
                              onClick={() => handleEditMedicao(m)}
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Editar
                            </Botao>
                            <Botao
                              variant="danger"
                              size="xs"
                              onClick={() => handleDelete(m.id, "medicao")}
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Excluir
                            </Botao>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Estilos
const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
};

const thStyle = {
  padding: "12px 8px",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: "500"
};

const tdStyle = {
  padding: "10px 8px",
  textAlign: "center",
  fontSize: "13px"
};