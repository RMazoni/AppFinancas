import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

const EditarMes = ({ todosLancamentos, setTodosLancamentos }) => {
  const { mes } = useParams(); // Captura o mês da URL
  const [lancamentosDoMes, setLancamentosDoMes] = useState([]);
  const [editableLancamentos, setEditableLancamentos] = useState({});

  useEffect(() => {
    // Verifica se o mês existe no objeto `todosLancamentos`
    if (todosLancamentos[mes]) {
      setLancamentosDoMes(todosLancamentos[mes]);
      // Inicializa o estado editável para os lançamentos do mês
      const editable = {};
      todosLancamentos[mes].forEach((lancamento) => {
        editable[lancamento.id] = { descricao: lancamento.descricao, valor: lancamento.valor };
      });
      setEditableLancamentos(editable);
    } else {
      setLancamentosDoMes([]);
    }
  }, [mes, todosLancamentos]);

  const handleEdit = (lancamentoId) => {
    const updatedLancamentos = lancamentosDoMes.map((lancamento) => {
      if (lancamento.id === lancamentoId) {
        return { ...lancamento, descricao: editableLancamentos[lancamentoId].descricao, valor: editableLancamentos[lancamentoId].valor };
      }
      return lancamento;
    });
    setLancamentosDoMes(updatedLancamentos);
    setTodosLancamentos((prev) => ({ ...prev, [mes]: updatedLancamentos }));
  };

  const handleInputChange = (lancamentoId, field, value) => {
    setEditableLancamentos((prev) => ({
      ...prev,
      [lancamentoId]: {
        ...prev[lancamentoId],
        [field]: value,
      },
    }));
  };

  return (
    <div className="editar-container"> {/* Adiciona uma classe de container */}
      <h2>Editando lançamentos para o mês: {mes}</h2>
      {lancamentosDoMes.length === 0 ? (
        <p>Nenhum lançamento encontrado para este mês.</p>
      ) : (
        <table className="tabela-editar"> {/* Adiciona uma classe à tabela */}
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lancamentosDoMes.map((lancamento) => (
              <tr key={lancamento.id || `${lancamento.data}-${lancamento.descricao}`}>
                <td>{lancamento.data}</td>
                <td>
                  <input
                    type="text"
                    value={editableLancamentos[lancamento.id]?.descricao || lancamento.descricao}
                    onChange={(e) => handleInputChange(lancamento.id, 'descricao', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={editableLancamentos[lancamento.id]?.valor || lancamento.valor}
                    onChange={(e) => handleInputChange(lancamento.id, 'valor', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <button onClick={() => handleEdit(lancamento.id)}>Salvar</button>                
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EditarMes;
