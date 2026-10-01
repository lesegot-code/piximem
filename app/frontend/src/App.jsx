// Student number: 25143230
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PostPage from './pages/PostPage';
import Navigation from './components/Navigation';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/home" element={<><Navigation /><HomePage /></>} />
        <Route path="/profile/:userId" element={<><Navigation /><ProfilePage /></>} />
        <Route path="/post/:postId" element={<><Navigation /><PostPage /></>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
