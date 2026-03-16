import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from "react-hot-toast";

export default function NovaLinha() {
  const { clienteAtual, nomeCliente } = useOutletContext();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [horasProdutivas, setHorasProdutivas] = useState(""); 
  const [produtosCadastrados, setProdutosCadastrados] = useState([]); 
  const [produtosSelecionados, setProdutosSelecionados] = useState([]); 
  const [salvando, setSalvando] = useState(false);

  // 1. Carregar produtos com ROTA CORRIGIDA
  useEffect(() => {
    const buscarProdutos = async () => {
      const idEmpresa = clienteAtual || localStorage.getItem("clienteAtual");

      if (idEmpresa) {
        try {
          // AQUI ESTÁ A CORREÇÃO: Forçando a string /produtos/ antes do ID
          console.log(`📡 HÓRUS: Chamando -> /produtos/${idEmpresa}`);
          const res = await api.get(`/produtos/${idEmpresa}`);
          
          if (res.data && Array.isArray(res.data)) {
            setProdutosCadastrados(res.data);
            console.log("✅ Produtos carregados:", res.data.length);
          } else {
            setProdutosCadastrados([]);
          }
        } catch (err) {
          console.error("❌ Erro na API:", err);
          toast.error("Erro ao carregar produtos");
        }
      }
    };

    buscarProdutos();
  }, [clienteAtual]);

  const adicionarProduto = (id) => {
    if (!id) return;
    const prod = produtosCadastrados.find(p => p.id === parseInt(id));
    if (!prod) return;

    const jaExiste = produtosSelecionados.find(p => p.id === prod.id);
    if (jaExiste) return toast.error("Produto já adicionado");

    setProdutosSelecionados([...produtosSelecionados, { 
      id: prod.id, 
      nome: prod.nome, 
      takt: "", 
      meta: 0 
    }]);
  };

  const atualizarPerformance = (index, taktDigitado) => {
    const novosProdutos = [...produtosSelecionados];
    novosProdutos[index].takt = taktDigitado;
    
    const horas = parseFloat(horasProdutivas);
    const takt = parseFloat(taktDigitado);

    if (takt > 0 && horas > 0) {
      novosProdutos[index].meta = Math.floor((horas * 3600) / takt);
    } else {
      novosProdutos[index].meta = 0;
    }
    setProdutosSelecionados(novosProdutos);
  };

  const handleSalvar = async () => {
    const idEmpresa = clienteAtual || localStorage.getItem("clienteAtual");
    if (!nome || !horasProdutivas || produtosSelecionados.length === 0) {
      return toast.error("Preencha tudo corretamente");
    }

    setSalvando(true);
    try {
      await api.post("/linhas-com-multiplos-produtos", {
        empresa_id: idEmpresa,
        nome,
        horas_produtivas: parseFloat(horasProdutivas),
        produtos: produtosSelecionados 
      });
      toast.success("Linha Master salva!");
      navigate("/linhas");
    } catch (err) {
      toast.error("Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#1E3A8A", marginBottom: "20px" }}>Nova Linha - {nomeCliente}</h1>
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>Nome da Linha:</label>
          <input 
            style={{ width: "100%", padding: "10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Extrusora 01"
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>Horas Produtivas/Dia:</label>
          <input 
            type="number" step="0.1"
            style={{ width: "100%", padding: "10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
            value={horasProdutivas} onChange={e => setHorasProdutivas(e.target.value)}
            placeholder="Ex: 8.8"
          />
        </div>

        <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold" }}>Adicionar Produto:</label>
          <select 
            onChange={(e) => { adicionarProduto(e.target.value); e.target.value = ""; }}
            style={{ width: "100%", padding: "10px", marginTop: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">Selecione um produto...</option>
            {produtosCadastrados.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          {produtosCadastrados.length === 0 && (
            <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>Nenhum produto encontrado. Verifique a API.</p>
          )}
        </div>

        {produtosSelecionados.length > 0 && (
          <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Produto</th>
                <th style={{ padding: "10px" }}>Takt (s)</th>
                <th style={{ padding: "10px" }}>Meta</th>
              </tr>
            </thead>
            <tbody>
              {produtosSelecionados.map((p, index) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{p.nome}</td>
                  <td style={{ padding: "10px" }}>
                    <input 
                      type="number" style={{ width: "70px", padding: "5px" }}
                      value={p.takt} onChange={(e) => atualizarPerformance(index, e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "10px", fontWeight: "bold" }}>{p.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
          <Botao variant="success" onClick={handleSalvar} loading={salvando}>Salvar</Botao>
          <Botao variant="danger" onClick={() => navigate("/linhas")}>Cancelar</Botao>
        </div>
      </div>
    </div>
  );
}