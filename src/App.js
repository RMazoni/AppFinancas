import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Importar from './pages/Importar';
import Resumo from './pages/Resumo';
import './App.css'; // Certifique-se de que este arquivo existe

function App() {
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
          <Route path="/" element={<Resumo />} /> {/* Tela inicial */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
