import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Importar from './pages/Importar';
import Resumo from './pages/Resumo';
import './App.css'; // Certifique-se de que este arquivo existe
import EditarMes from './pages/Editar';

function App() {
  const [todosLancamentos, setTodosLancamentos] = useState({});

  // Função para gerar o novo ID no formato correto
  function gerarIdTransacao(tipoConta, ano, mes, index) {
    const prefixo = tipoConta === 'Conta Corrente' ? 'CC' : 'PP';
    const mesAno = `${ano}${mes.padStart(2, '0')}`; // Garante que o mês tenha dois dígitos
    return `${prefixo}-${mesAno}-${String(index + 1).padStart(2, '0')}`; // ID no formato CC-AAAA-MM-XX
  }

  // Função para atualizar os IDs das transações já salvas no localStorage
  function atualizarIdsTransacoes() {
    // Carrega o histórico salvo no localStorage (ajuste o nome da chave 'historico' conforme seu app)
    const historico = JSON.parse(localStorage.getItem('historico')) || {};

    // Percorre todos os meses no histórico
    Object.keys(historico).forEach((mesAno) => {
      const transacoes = historico[mesAno];

      // Percorre cada transação para atualizar o ID
      transacoes.forEach((transacao, index) => {
        const { fonte, data } = transacao; // fonte pode ser 'Conta Corrente' ou 'Poupança'

        // Extrai o ano e o mês da data da transação (assumindo que o formato é dd/mm/aaaa)
        const [, mes, ano] = data.split('/');

        // Cria um novo ID baseado no tipo de conta, ano, mês e índice da transação
        const novoId = gerarIdTransacao(fonte, ano, mes, index);

        // Atualiza o ID da transação
        transacao.id = novoId;
      });

      // Atualiza as transações no histórico com os novos IDs
      historico[mesAno] = transacoes;
    });

    // Salva o histórico atualizado no localStorage
    localStorage.setItem('historico', JSON.stringify(historico));

    console.log('IDs das transações atualizados com sucesso!');
  }

  // Função que executa a atualização dos IDs se ainda não tiver sido feita
  if (!localStorage.getItem('idsAtualizados')) {
    atualizarIdsTransacoes();
    localStorage.setItem('idsAtualizados', 'true'); // Marca que a atualização foi feita
  }

  // Carregar os lançamentos do localStorage ao carregar o app
  useEffect(() => {
    const lancamentosSalvos = JSON.parse(localStorage.getItem('historico')) || {};
    setTodosLancamentos(lancamentosSalvos);
  }, []);

  // Atualizar o localStorage sempre que `todosLancamentos` mudar
  useEffect(() => {
    if (Object.keys(todosLancamentos).length > 0) {
      localStorage.setItem('historico', JSON.stringify(todosLancamentos));
    }
  }, [todosLancamentos]);

  return (
    <Router>
      <div>
        <nav>
          <Link to="/resumo">
            <button>Resumo Mensal</button>
          </Link>
          <Link to="/importar">
            <button>Importar Arquivos</button>
          </Link>
        </nav>

        <Routes>
          <Route path="/resumo" element={<Resumo />} />
          <Route path="/importar" element={<Importar />} />
          <Route
            path="/editar/:mes"
            element={<EditarMes todosLancamentos={todosLancamentos} setTodosLancamentos={setTodosLancamentos} />}
          />
          <Route path="/" element={<Resumo />} /> {/* Tela inicial */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
