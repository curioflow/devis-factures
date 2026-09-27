import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Clients from './pages/Clients'
import Dashboard from './pages/Dashboard'
import DocumentPage from './pages/DocumentPage'
import ListeDocuments from './pages/ListeDocuments'
import Parametres from './pages/Parametres'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="devis" element={<ListeDocuments type="devis" />} />
          <Route path="devis/:id" element={<DocumentPage type="devis" />} />
          <Route path="factures" element={<ListeDocuments type="facture" />} />
          <Route path="factures/:id" element={<DocumentPage type="facture" />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
