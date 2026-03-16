import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from "react-hot-toast";

export default function NovaLinha() {
  const { clienteAtual, nomeCliente } = useOutletContext();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [horasProdutivas, setHorasProdutivas] = useState(8.8);
  const [produtosCadastrados, setProdutosCadastrados] = useState([]); // Todos da empresa
  const [produtosSelecionados, setProdutosSelecionados] = useState([]); // O que vai na linha
  const [salvando, setSalvando] = useState(false);

  // 1. Carregar produtos da empresa atual
  useEffect(() => {
    if (clienteAtual) {
      api.get(`/produtos/${clienteAtual}`)
        .then(res => setProdutosCadastrados(res.data))
        .catch(() => toast.error("Erro ao carregar produtos"));
    }
  }, [clienteAtual]);

  // 2. Adicionar produto à matriz de performance
  const adicionarProduto = (id) => {
    if (!id) return;
    const jaExiste = produtosSelecionados.find(p => p.id === parseInt(id));
    if (jaExiste) return toast.error("Produto já adicionado");

    const prod = produtosCadastrados.find(p => p.id === parseInt(id));
    setProdutosSelecionados([...produtosSelecionados, { 
      id: prod.id, 
      nome: prod.nome, 
      takt: "", 
      meta: 0 
    }]);
  };

  // 3. Cálculo de Engenharia (Meta Automática)
  const atualizarPerformance = (index, taktDigitado) => {
    const novosProdutos = [...produtosSelecionados];
    novosProdutos[index].takt = taktDigitado;
    
    if (taktDigitado > 0) {
      // Fórmula: (Horas * 3600) / Takt
      const calculoMeta = Math.floor((horasProdutivas * 3600) / taktDigitado);
      novosProdutos[index].meta = calculoMeta;
    } else {
      novosProdutos[index].meta = 0;
    }
    setProdutosSelecionados(novosProdutos);
  };

  const handleSalvar = async () => {
    if (!nome || produtosSelecionados.length === 0) {
      return toast.error("Preencha o nome e selecione ao menos um produto");
    }

    setSalvando(true);
    try {
      const payload = {
        empresa_id: clienteAtual,
        nome,
        horas_produtivas: horasProdutivas,
        produtos: produtosSelecionados // Enviando o array com takt e meta
      };

      await api.post("/linhas-com-multiplos-produtos", payload);
      toast.success("Linha Master cadastrada!");
      navigate("/linhas");
    } catch (err) {
      toast.error("Erro ao salvar linha");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#1E3A8A" }}>Nova Linha - {nomeCliente}</h1>
      
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: "15px" }}>
          <label>Nome da Linha:</label>
          <input 
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Extrusora Balão 01"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Horas Produtivas/Dia:</label>
          <input 
            type="number" step="0.1"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            value={horasProdutivas} onChange={e => setHorasProdutivas(e.target.value)}
          />
        </div>

        <hr />

        <div style={{ marginBottom: "15px", marginTop: "15px" }}>
          <label>Adicionar Produto na Linha:</label>
          <select 
            onChange={(e) => adicionarProduto(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Selecione um produto...</option>
            {produtosCadastrados.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* MATRIZ DE PERFORMANCE */}
        {produtosSelecionados.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th>Produto</th>
                <th>Takt (s)</th>
                <th>Meta (pçs)</th>
              </tr>
            </thead>
            <tbody>
              {produtosSelecionados.map((p, index) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px 0" }}>{p.nome}</td>
                  <td>
                    <input 
                      type="number"
                      style={{ width: "60px", padding: "5px" }}
                      value={p.takt}
                      onChange={(e) => atualizarPerformance(index, e.target.value)}
                    />
                  </td>
                  <td style={{ fontWeight: "bold", color: "#16a34a" }}>{p.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
          <Botao variant="success" onClick={handleSalvar} loading={salvando}>Salvar Linha Master</Botao>
          <Botao variant="danger" onClick={() => navigate("/linhas")}>Cancelar</Botao>
        </div>
      </div>
    </div>
  );
}