import React from 'react';
import { useNavigate } from 'react-router-dom';

function Resumo() {
  const navigate = useNavigate();
  const historico = JSON.parse(localStorage.getItem('historico')) || {};

  // Função para agrupar meses por ano
  const agruparPorAno = (historico) => {
    const agrupado = {};
    Object.keys(historico).forEach((mes) => {
      const ano = mes.split('-')[0]; // Extraindo o ano de 'aaaa-mm'
      if (!agrupado[ano]) {
        agrupado[ano] = [];
      }
      agrupado[ano].push(mes);
    });
    return agrupado;
  };

  const historicoAgrupadoPorAno = agruparPorAno(historico);
  
  // Ordena os anos de forma decrescente (ano atual primeiro)
  const anosOrdenados = Object.keys(historicoAgrupadoPorAno).sort((a, b) => b - a);

  const handleEdit = (mes) => {
    navigate(`/importar/${mes}`); // Passa o mês como parâmetro na URL
  };
  
  const handleDelete = (mes) => {
    if (window.confirm(`Você tem certeza que deseja excluir o histórico de ${mes}?`)) {
      delete historico[mes];
      localStorage.setItem('historico', JSON.stringify(historico));
      alert('Histórico excluído com sucesso!');
      window.location.reload(); // Recarrega a página para atualizar a lista
    }
  };

  return (
    <div>
      <h1>Resumo das Transações</h1>
      {anosOrdenados.map((ano) => {
        let saldoAnual = 0; // Acumula o saldo do ano

        // Ordena os meses de forma crescente
        const mesesOrdenados = historicoAgrupadoPorAno[ano].sort();

        return (
          <div key={ano}>
            <h2>Ano: {ano}</h2>
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Receitas</th>
                  <th>Despesas</th>
                  <th>Saldo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {mesesOrdenados.map((mes) => {
                  const transacoes = historico[mes];
                  const totalReceitas = transacoes.filter(t => t.valor > 0).reduce((acc, t) => acc + t.valor, 0);
                  const totalDespesas = transacoes.filter(t => t.valor < 0).reduce((acc, t) => acc + t.valor, 0);
                  const saldo = totalReceitas + totalDespesas; // Despesas são negativas

                  saldoAnual += saldo; // Acumula o saldo para o ano

                  return (
                    <tr key={mes}>
                      <td>{mes}</td>
                      <td>R$ {totalReceitas.toFixed(2)}</td>
                      <td>R$ {Math.abs(totalDespesas).toFixed(2)}</td>
                      <td>R$ {saldo.toFixed(2)}</td>
                      <td>
                        <button onClick={() => handleEdit(mes)}>Editar</button>
                        <button onClick={() => handleDelete(mes)}>Excluir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <h3>Saldo Anual: R$ {saldoAnual.toFixed(2)}</h3>
          </div>
        );
      })}
    </div>
  );
}

export default Resumo;
