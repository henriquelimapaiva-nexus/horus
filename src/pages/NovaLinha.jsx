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

  // 1. Carregar produtos da empresa via rota especializada
  useEffect(() => {
    const buscarProdutos = async () => {
      const idEmpresa = clienteAtual || localStorage.getItem("clienteAtual");

      if (idEmpresa) {
        try {
          console.log(`📡 HÓRUS: Buscando lista da empresa em -> /products/company/${idEmpresa}`);
          // ✅ CORRIGIDO: /produtos/filtro/empresa/${idEmpresa} → /products/company/${idEmpresa}
          const res = await api.get(`/products/company/${idEmpresa}`);
          
          if (res.data && Array.isArray(res.data)) {
            setProdutosCadastrados(res.data);
            console.log("✅ Produtos carregados:", res.data.length);
          } else {
            setProdutosCadastrados([]);
          }
        } catch (err) {
          console.error("❌ Erro na API:", err);
          toast.error("Erro ao carregar produtos desta empresa.");
        }
      }
    };

    buscarProdutos();
  }, [clienteAtual]);

  // 2. Adicionar produto à matriz de performance
  const adicionarProduto = (id) => {
    if (!id) return;
    const prod = produtosCadastrados.find(p => p.id === parseInt(id));
    if (!prod) return;

    const jaExiste = produtosSelecionados.find(p => p.id === prod.id);
    if (jaExiste) return toast.error("Produto já está na lista");

    setProdutosSelecionados([...produtosSelecionados, { 
      id: prod.id, 
      nome: prod.nome, 
      takt: "", 
      meta: 0 
    }]);
  };

  // 3. Cálculo de Engenharia
  const atualizarPerformance = (index, taktDigitado) => {
    const novosProdutos = [...produtosSelecionados];
    novosProdutos[index].takt = taktDigitado;
    
    const horas = parseFloat(horasProdutivas);
    const takt = parseFloat(taktDigitado);

    if (takt > 0 && horas > 0) {
      // (Horas * 3600 segundos) / Takt
      novosProdutos[index].meta = Math.floor((horas * 3600) / takt);
    } else {
      novosProdutos[index].meta = 0;
    }
    setProdutosSelecionados(novosProdutos);
  };

  const handleSalvar = async () => {
    const idEmpresa = clienteAtual || localStorage.getItem("clienteAtual");

    if (!nome || !horasProdutivas || produtosSelecionados.length === 0) {
      return toast.error("Preencha o nome, horas e adicione ao menos um produto");
    }

    setSalvando(true);
    try {
      const payload = {
        empresa_id: parseInt(idEmpresa),
        nome,
        horas_produtivas: parseFloat(horasProdutivas),
        produtos: produtosSelecionados.map(p => ({
          id: p.id,
          takt: parseFloat(p.takt) || 0,
          meta: p.meta
        }))
      };

      // ✅ CORRIGIDO: /linhas-com-multiplos-produtos → /lines-master
      await api.post("/lines-master", payload);
      toast.success("Linha Master cadastrada com sucesso!");
      navigate("/linhas");
    } catch (err) {
      console.error(err);
      
      // Tratamento de erro específico
      if (err.response?.status === 400) {
        toast.error(err.response.data.erro || "Erro ao salvar a linha.");
      } else {
        toast.error("Erro ao salvar a linha no banco.");
      }
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
              e.target.value = ""; 
            }}
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            <option value="">Selecione um produto cadastrado...</option>
            {produtosCadastrados.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          {produtosCadastrados.length === 0 && (
            <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "5px" }}>
              Nenhum produto disponível para esta empresa.
            </p>
          )}
        </div>

        {/* TABELA DE ENGENHARIA */}
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