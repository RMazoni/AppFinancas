import React, { useState } from 'react';
import Papa from 'papaparse';
import './Importar.css'; // Importando um arquivo de estilo

function Importar() {
  const [transacoesCorrente, setTransacoesCorrente] = useState([]);
  const [transacoesPoupanca, setTransacoesPoupanca] = useState([]);
  const [confirmaSalvar, setConfirmaSalvar] = useState(false);

  // Função para converter o valor com base no tipo de conta
  const converterValor = (valor, tipoConta) => {
    if (valor) {
      let valorFormatado = valor.replace(/\s/g, '');
      if (tipoConta === 'Conta Corrente') {
        valorFormatado = valorFormatado.replace(',', '.');
      } else if (tipoConta === 'Conta Poupança') {
        valorFormatado = valorFormatado.replace(/\./g, '');
        valorFormatado = valorFormatado.replace(',', '.');
      }
      if (valorFormatado.endsWith('D')) {
        valorFormatado = valorFormatado.slice(0, -1);
        return -parseFloat(valorFormatado) || 0;
      } else if (valorFormatado.endsWith('C')) {
        valorFormatado = valorFormatado.slice(0, -1);
        return parseFloat(valorFormatado) || 0;
      }
      return parseFloat(valorFormatado) || 0;
    }
    return 0;
  };

  // Função que aplica os filtros de descrições que devem ser ignoradas
  const deveIgnorarTransacao = (descricao) => {
    const descricoesIgnoradas = [
      "BB Rende Fácil",
      "Aplicação Poupança",
      "Transferência de Crédito"
    ];
    return descricoesIgnoradas.some(filtro => descricao.includes(filtro));
  };

  // Função para mapear cada transação e aplicar os filtros
  const mapearExtrato = (row, index, tipoConta) => {
    if (deveIgnorarTransacao(row['Histórico'])) {
      return null; // Ignora a transação se o filtro for acionado
    }
    
    return {
      id: index + 1,
      data: row['Data'] || 'Data Indisponível',
      descricao: row['Histórico'] || 'Sem Descrição',
      valor: converterValor(row['Valor'], tipoConta),
      categoria: 'Sem Categoria',
      fonte: tipoConta
    };
  };

  // Função para importar o extrato da conta corrente
  const handleUploadContaCorrente = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      encoding: "ISO-8859-1",
      complete: (result) => {
        const relevantRows = result.data.slice(1, result.data.length - 2);
        const newTransactions = relevantRows
          .map((row, index) => mapearExtrato(row, index, 'Conta Corrente'))
          .filter(Boolean); // Remove transações nulas (ignoradas)
        setTransacoesCorrente(newTransactions);
      }
    });
  };

  // Função para importar o extrato da conta poupança
  const handleUploadContaPoupanca = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      encoding: "ISO-8859-1",
      complete: (result) => {
        const relevantRows = result.data.filter(row => row['Data'] && row['Histórico'] && row['Valor']);
        const newTransactions = relevantRows
          .map((row, index) => mapearExtrato(row, index, 'Conta Poupança'))
          .filter(Boolean); // Remove transações nulas (ignoradas)
        setTransacoesPoupanca(newTransactions);
      }
    });
  };

  // Função para salvar o histórico
  const salvarHistorico = () => {
    const primeiraTransacao = transacoesCorrente.length > 0 ? transacoesCorrente[0] : transacoesPoupanca[0];
    
    if (!primeiraTransacao) {
      alert('Nenhuma transação foi importada.');
      return;
    }
  
    const dataTransacao = primeiraTransacao.data; // formato dd/mm/aaaa
    const [, mes, ano] = dataTransacao.split('/'); // Agora só pegamos mês e ano
  
    const anoMes = `${ano}-${mes}`; // Formato 'aaaa-mm'
    
    const historico = JSON.parse(localStorage.getItem('historico')) || {};
  
    const todasTransacoes = [...transacoesCorrente, ...transacoesPoupanca];
    
    if (historico[anoMes]) {
      historico[anoMes] = [...historico[anoMes], ...todasTransacoes];
    } else {
      historico[anoMes] = todasTransacoes;
    }
  
    localStorage.setItem('historico', JSON.stringify(historico));
  
    setConfirmaSalvar(false);
    alert('Transações salvas com sucesso!');
  };

  // Função para calcular o saldo
  const calcularSaldos = () => {
    const receitas = [...transacoesCorrente, ...transacoesPoupanca].filter(transacao => transacao.valor > 0);
    const despesas = [...transacoesCorrente, ...transacoesPoupanca].filter(transacao => transacao.valor < 0);
    const totalReceitas = receitas.reduce((acc, transacao) => acc + transacao.valor, 0);
    const totalDespesas = Math.abs(despesas.reduce((acc, transacao) => acc + transacao.valor, 0));
    const saldo = totalReceitas - totalDespesas;
    return { totalReceitas, totalDespesas, saldo };
  };

  const { totalReceitas, totalDespesas, saldo } = calcularSaldos();

  return (
    <div className="importar-container">
      <h1>Importar Arquivos</h1>

      <h2>Importar Extrato Conta Corrente</h2>
      <input 
        type="file" 
        accept=".csv"
        onChange={handleUploadContaCorrente} 
      />

      <h2>Importar Extrato Conta Poupança</h2>
      <input 
        type="file" 
        accept=".csv"
        onChange={handleUploadContaPoupanca} 
      />

      <div className="tabelas-container">
        {transacoesCorrente.length > 0 && (
          <div className="tabela">
            <h3>Transações da Conta Corrente</h3>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesCorrente.map(transacao => (
                  <tr key={transacao.id}>
                    <td>{transacao.data}</td>
                    <td>{transacao.descricao}</td>
                    <td>{transacao.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transacoesPoupanca.length > 0 && (
          <div className="tabela">
            <h3>Transações da Conta Poupança</h3>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesPoupanca.map(transacao => (
                  <tr key={transacao.id}>
                    <td>{transacao.data}</td>
                    <td>{transacao.descricao}</td>
                    <td>{transacao.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(transacoesCorrente.length > 0 || transacoesPoupanca.length > 0) && (
        <div className="acao-salvar">
          <button onClick={() => setConfirmaSalvar(true)}>Conferir e Salvar</button>
          {confirmaSalvar && (
            <div>
              <button onClick={salvarHistorico}>Salvar</button>
            </div>
          )}
        </div>
      )}

      <div className="resumo">
        <h3>Resumo das Transações</h3>
        <p>As suas receitas foram: R$ {totalReceitas.toFixed(2)}</p>
        <p>Suas despesas foram: R$ {totalDespesas.toFixed(2)}</p>
        <p>Gerando o saldo: R$ {saldo.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default Importar;
