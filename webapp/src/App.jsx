import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotesPage from './pages/NotesPage'
import SubjectFilesPage from './pages/SubjectFilesPage'
import ViewerPage from './pages/ViewerPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/subject/:code" element={<SubjectFilesPage />} />
        <Route path="/notes/:sem/:code" element={<NotesPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
