import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AgendamentosPage from './pages/AgendamentosPage'
import FinanceiroPage from './pages/FinanceiroPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AgendamentosPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
