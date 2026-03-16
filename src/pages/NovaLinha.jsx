import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from "react-hot-toast";

export default function NovaLinha() {
  const { clienteAtual, nomeCliente } = useOutletContext();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  // Ajustado para começar vazio conforme solicitado
  const [horasProdutivas, setHorasProdutivas] = useState(""); 
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
    
    // Só calcula se houver horas produtivas e takt definidos
    if (taktDigitado > 0 && horasProdutivas > 0) {
      // Fórmula: (Horas * 3600) / Takt
      const calculoMeta = Math.floor((parseFloat(horasProdutivas) * 3600) / parseFloat(taktDigitado));
      novosProdutos[index].meta = calculoMeta;
    } else {
      novosProdutos[index].meta = 0;
    }
    setProdutosSelecionados(novosProdutos);
  };

  // Recalcula todas as metas se as horas produtivas mudarem
  useEffect(() => {
    if (produtosSelecionados.length > 0) {
      const atualizados = produtosSelecionados.map(p => {
        if (p.takt > 0 && horasProdutivas > 0) {
          return { ...p, meta: Math.floor((parseFloat(horasProdutivas) * 3600) / parseFloat(p.takt)) };
        }
        return { ...p, meta: 0 };
      });
      setProdutosSelecionados(atualizados);
    }
  }, [horasProdutivas]);

  const handleSalvar = async () => {
    if (!nome || !horasProdutivas || produtosSelecionados.length === 0) {
      return toast.error("Preencha nome, horas produtivas e selecione produtos");
    }

    setSalvando(true);
    try {
      const payload = {
        empresa_id: clienteAtual,
        nome,
        horas_produtivas: parseFloat(horasProdutivas),
        produtos: produtosSelecionados 
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
      <h1 style={{ color: "#1E3A8A", marginBottom: "20px" }}>Nova Linha - {nomeCliente}</h1>
      
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Nome da Linha:</label>
          <input 
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Extrusora Balão 01"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Horas Produtivas/Dia:</label>
          <input 
            type="number" step="0.1"
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
            value={horasProdutivas} 
            onChange={e => setHorasProdutivas(e.target.value)}
            placeholder="Ex: 8.8"
          />
        </div>

        <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Adicionar Produto na Linha:</label>
          <select 
            onChange={(e) => {
              adicionarProduto(e.target.value);
              e.target.value = ""; // Reseta o select após adicionar
            }}
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">Selecione um produto cadastrado...</option>
            {produtosCadastrados.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* MATRIZ DE PERFORMANCE */}
        {produtosSelecionados.length > 0 && (
          <div style={{ marginTop: "20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                  <th style={{ padding: "10px" }}>Produto</th>
                  <th style={{ padding: "10px" }}>Takt (s)</th>
                  <th style={{ padding: "10px" }}>Meta (un)</th>
                </tr>
              </thead>
              <tbody>
                {produtosSelecionados.map((p, index) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{p.nome}</td>
                    <td style={{ padding: "10px" }}>
                      <input 
                        type="number"
                        style={{ width: "80px", padding: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
                        value={p.takt}
                        placeholder="0.0"
                        onChange={(e) => atualizarPerformance(index, e.target.value)}
                      />
                    </td>
                    <td style={{ padding: "10px", fontWeight: "bold", color: "#16a34a" }}>
                      {p.meta.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
          <Botao variant="success" onClick={handleSalvar} loading={salvando}>Salvar Linha Master</Botao>
          <Botao variant="danger" onClick={() => navigate("/linhas")}>Cancelar</Botao>
        </div>
      </div>
    </div>
  );
}