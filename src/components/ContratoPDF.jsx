// src/components/ContratoPDF.jsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logo from '../assets/logo.png';

// Estilos exatos para impressão profissional
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.4
  },
  header: {
    textAlign: 'center',
    marginBottom: 30
  },
  logo: {
    width: 80,
    marginBottom: 10,
    alignSelf: 'center'
  },
  empresaNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 5
  },
  linha: {
    borderBottom: '1px solid #1E3A8A',
    width: '80%',
    margin: '8px auto'
  },
  tituloContrato: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20
  },
  clausulaTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 15,
    marginBottom: 8
  },
  clausulaSubtitulo: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5
  },
  text: {
    marginBottom: 4,
    textAlign: 'justify'
  },
  lista: {
    marginLeft: 20,
    marginBottom: 4
  },
  assinatura: {
    marginTop: 30,
    textAlign: 'center'
  },
  linhaAssinatura: {
    marginTop: 20,
    textAlign: 'center'
  },
  testemunhas: {
    marginTop: 30
  },
  tabela: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#000'
  },
  tabelaLinha: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  tabelaCelula: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000'
  }
});

export default function ContratoPDF({ dados }) {
  const { contratoTexto, empresa, representante, valorNegociado, dataAssinatura, contato } = dados;

  // Função para extrair partes do texto (simplificada)
  const getClausulas = () => {
    // Se você preferir, pode passar os dados estruturados em vez de texto puro
    // Por enquanto, vamos retornar o texto simples formatado
    return contratoTexto;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <Text style={styles.empresaNome}>NEXUS ENGENHARIA APLICADA</Text>
          <View style={styles.linha} />
        </View>

        <Text style={styles.tituloContrato}>
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA - FASE 1 (DIAGNÓSTICO)
        </Text>

        {/* Partes */}
        <Text style={styles.text}>
          <Text style={{ fontWeight: 'bold' }}>CONTRATANTE:</Text> {empresa.nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {empresa.cnpj}, com sede na {empresa.endereco}, neste ato representada por {representante.nome}, {representante.nacionalidade}, {representante.estado_civil}, {representante.profissao}, portador do RG nº {representante.rg} e CPF nº {representante.cpf}, residente e domiciliado na {representante.endereco}.
        </Text>

        <Text style={styles.text}>
          <Text style={{ fontWeight: 'bold' }}>CONTRATADA:</Text> NEXUS ENGENHARIA APLICADA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ DA NEXUS], com sede na [ENDEREÇO DA NEXUS], neste ato representada por [SEU NOME], [NACIONALIDADE], [ESTADO CIVIL], [PROFISSÃO], portador do RG nº [RG] e CPF nº [CPF], residente e domiciliado na [ENDEREÇO].
        </Text>

        <Text style={styles.text}>
          As partes, acima identificadas, têm entre si justo e contratado o seguinte:
        </Text>

        {/* CLÁUSULA 1 */}
        <Text style={styles.clausulaTitulo}>CLÁUSULA 1 – OBJETO</Text>
        <Text style={styles.text}>1.1. O presente contrato tem por objeto a prestação de serviços de consultoria em engenharia de produção, limitados à Fase 1 – Diagnóstico, conforme descrito no Anexo I, que passa a fazer parte integrante deste instrumento.</Text>
        <Text style={styles.text}>1.2. A Fase 1 compreende exclusivamente:</Text>
        <Text style={styles.lista}>a) Mapeamento do fluxo de valor (VSM) das áreas produtivas indicadas pela CONTRATANTE;</Text>
        <Text style={styles.lista}>b) Coleta e análise de dados operacionais (tempos de ciclo, disponibilidade, qualidade);</Text>
        <Text style={styles.lista}>c) Identificação de gargalos e oportunidades de melhoria;</Text>
        <Text style={styles.lista}>d) Elaboração e entrega de relatório técnico contendo diagnóstico e recomendações.</Text>
        
        <Text style={styles.text}>1.3. Não fazem parte do objeto deste contrato:</Text>
        <Text style={styles.lista}>a) Implementação de qualquer melhoria identificada;</Text>
        <Text style={styles.lista}>b) Acompanhamento pós-diagnóstico;</Text>
        <Text style={styles.lista}>c) Qualquer serviço ou atividade não expressamente previsto no Anexo I.</Text>
        
        <Text style={styles.text}>1.4. Após a entrega e aprovação do relatório de diagnóstico, as partes poderão, mediante aditivo contratual ou novo contrato, estabelecer o escopo, os prazos e os valores para a Fase 2 – Implementação e Fase 3 – Acompanhamento, com base nos dados reais coletados e nas oportunidades identificadas.</Text>

        {/* CLÁUSULA 4 - VALOR (com tabela) */}
        <Text style={styles.clausulaTitulo}>CLÁUSULA 4 – VALOR E CONDIÇÕES DE PAGAMENTO</Text>
        <Text style={styles.text}>4.1. O valor total dos serviços objeto deste contrato é de R$ {valorNegociado.toLocaleString('pt-BR')} ({valorNegociado.toLocaleString('pt-BR')} reais).</Text>
        
        <Text style={styles.clausulaSubtitulo}>Dados Bancários:</Text>
        <View style={styles.tabela}>
          <View style={styles.tabelaLinha}>
            <View style={styles.tabelaCelula}><Text>Banco</Text></View>
            <View style={styles.tabelaCelula}><Text>[BANCO]</Text></View>
          </View>
          <View style={styles.tabelaLinha}>
            <View style={styles.tabelaCelula}><Text>Agência</Text></View>
            <View style={styles.tabelaCelula}><Text>[AGÊNCIA]</Text></View>
          </View>
          <View style={styles.tabelaLinha}>
            <View style={styles.tabelaCelula}><Text>Conta</Text></View>
            <View style={styles.tabelaCelula}><Text>[CONTA]</Text></View>
          </View>
          <View style={styles.tabelaLinha}>
            <View style={styles.tabelaCelula}><Text>Titular</Text></View>
            <View style={styles.tabelaCelula}><Text>NEXUS ENGENHARIA APLICADA</Text></View>
          </View>
        </View>

        {/* Assinaturas */}
        <View style={styles.assinatura}>
          <Text>E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.</Text>
          <Text>{empresa.cidade}, {dataAssinatura}.</Text>
        </View>

        <View style={styles.linhaAssinatura}>
          <Text>_________________________________</Text>
          <Text>CONTRATANTE</Text>
          <Text>{empresa.nome}</Text>
          <Text>{representante.nome}</Text>
          <Text>[Cargo]</Text>
        </View>

        <View style={styles.linhaAssinatura}>
          <Text>_________________________________</Text>
          <Text>CONTRATADA</Text>
          <Text>NEXUS ENGENHARIA APLICADA</Text>
          <Text>[SEU NOME]</Text>
          <Text>[Cargo]</Text>
        </View>

        <View style={styles.testemunhas}>
          <Text>TESTEMUNHAS:</Text>
          <Text>1. _________________________________</Text>
          <Text>   Nome: _______________________________</Text>
          <Text>   RG: _______________________________</Text>
          <Text>   CPF: _______________________________</Text>
          <Text>2. _________________________________</Text>
          <Text>   Nome: _______________________________</Text>
          <Text>   RG: _______________________________</Text>
          <Text>   CPF: _______________________________</Text>
        </View>
      </Page>
    </Document>
  );
}