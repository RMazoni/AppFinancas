import React, { useState } from 'react';
import Papa from 'papaparse';
import './Importar.css'; // Importando um arquivo de estilo

const mesJaImportado = (mesAno) => {
  const historico = JSON.parse(localStorage.getItem('historico')) || {};
  return historico[mesAno] !== undefined;
}

function Importar() {
  const [transacoesCorrente, setTransacoesCorrente] = useState([]);
  const [transacoesPoupanca, setTransacoesPoupanca] = useState([]);
  const [confirmaSalvar, setConfirmaSalvar] = useState(false);

  // Função para gerar o ID no formato CCYYYYMM-XX ou PPYYYYMM-XX
  const gerarIdTransacao = (tipoConta, ano, mes, index) => {
    const prefixo = tipoConta === 'Conta Corrente' ? 'CC' : 'PP';
    const mesAno = `${ano}${mes.padStart(2, '0')}`; // Certifica que o mês tem dois dígitos
    return `${prefixo}${mesAno}-${String(index + 1).padStart(2, '0')}`; // Adiciona o número da transação com dois dígitos
  };

  // Função para converter o valor com base no tipo de conta
  const converterValor = (valor, tipoConta) => {
    if (valor) {
      let valorFormatado = valor.replace(/\s/g, '');
      if (tipoConta === 'Conta Corrente') {
        valorFormatado = valorFormatado.replace(',', '.');
      } else if (tipoConta === 'Conta Poupança') {
        valorFormatado = valorFormatado.replace(',', '.');
        valorFormatado = valorFormatado.replace(/\.(?=\d{3})/g, '');        
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
      "Transferência de Crédito",
      "Tesouro Direto-Compra",
      "Compra de Ações",
      "Transferido da poupança",
      "Transferencia Para Conta"
    ];
    return descricoesIgnoradas.some(filtro => descricao.includes(filtro));
  };

  // Função para mapear cada transação e aplicar os filtros
  const mapearExtrato = (row, index, tipoConta, ano, mes) => {
    if (deveIgnorarTransacao(row['Histórico'])) {
      return null; // Ignora a transação se o filtro for acionado
    }

    return {
      id: gerarIdTransacao(tipoConta, ano, mes, index), // Gera o ID com a nova formatação
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
        const primeiraTransacao = relevantRows[0];

        if (!primeiraTransacao) return;

        const [, mes, ano] = primeiraTransacao['Data'].split('/');
        const mesAno = `${ano}-${mes}`;

        if (mesJaImportado(mesAno)) {
          const substituir = window.confirm(`O mês ${mes}/${ano} já foi importado. Deseja substituir os dados?`);
          if (!substituir) return;
        }

        const newTransactions = relevantRows
          .map((row, index) => mapearExtrato(row, index, 'Conta Corrente', ano, mes))
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
        const primeiraTransacao = relevantRows[0];

        if (!primeiraTransacao) return;

        const [, mes, ano] = primeiraTransacao['Data'].split('/');
        const mesAno = `${ano}-${mes}`;

        if (mesJaImportado(mesAno)) {
          const substituir = window.confirm(`O mês ${mes}/${ano} já foi importado. Deseja substituir os dados?`);
          if (!substituir) return;
        }

        const newTransactions = relevantRows
          .map((row, index) => mapearExtrato(row, index, 'Conta Poupança', ano, mes))
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
    const [, mes, ano] = dataTransacao.split('/'); // Pegando o mês e o ano
    
    const anoMes = `${ano}-${mes}`; // Formato 'aaaa-mm'
    
    const historico = JSON.parse(localStorage.getItem('historico')) || {};
  
    const todasTransacoes = [...transacoesCorrente, ...transacoesPoupanca];
    
    // Verifica se já existem transações para o mês/ano
    if (historico[anoMes]) {
      const substituir = window.confirm(`O mês ${mes}/${ano} já possui transações. Deseja substituir os dados existentes?`);
      if (substituir) {
        historico[anoMes] = todasTransacoes; // Substitui as transações
      } else {
        return; // Cancela o salvamento
      }
    } else {
      historico[anoMes] = todasTransacoes; // Adiciona transações novas
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
                  <th>ID</th>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesCorrente.map((transacao) => (
                  <tr key={transacao.id}>
                    <td>{transacao.id}</td>
                    <td>{transacao.data}</td>
                    <td>{transacao.descricao}</td>
                    <td style={{ color: transacao.valor < 0 ? 'red' : 'black' }}>
                      {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
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
                  <th>ID</th>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesPoupanca.map((transacao) => (
                  <tr key={transacao.id}>
                    <td>{transacao.id}</td>
                    <td>{transacao.data}</td>
                    <td>{transacao.descricao}</td>
                    <td style={{ color: transacao.valor < 0 ? 'red' : 'black' }}>
                      {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(transacoesCorrente.length > 0 || transacoesPoupanca.length > 0) && (
          <div className="resumo">
            <p>Receitas: {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p>Despesas: {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p>Saldo: {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <button onClick={salvarHistorico}>Salvar Transações</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Importar;
