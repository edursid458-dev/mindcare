import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Chatbot from './pages/Chatbot'
import Checkins from './pages/Checkins'
import Wearables from './pages/Wearables'
import Insights from './pages/Insights'
import Recommendations from './pages/Recommendations'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<Chatbot />} />
            <Route path="checkins" element={<Checkins />} />
            <Route path="wearables" element={<Wearables />} />
            <Route path="insights" element={<Insights />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
