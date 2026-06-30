import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Orbit — in costruzione 🚀</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
