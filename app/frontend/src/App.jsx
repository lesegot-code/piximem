import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useUi } from "./context/UiContext.jsx";
import { getProfile } from "./api.js";
import Navigation from "./components/Navigation.jsx";
import Modal from "./components/Modal.jsx";
import PostForm from "./components/PostForm.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PostPage from "./pages/PostPage.jsx";
import AlbumPage from "./pages/AlbumPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import NotFound from "./pages/NotFound.jsx";

//"Share a Memory" can be opened from any page
function ComposeModal()
{
  const { user } = useAuth();
  const { setComposeOpen, toast, refreshData } = useUi();
  const navigate = useNavigate();
  const location = useLocation();
  const [recent, setRecent] = useState([]);

  //your own posts, for hashtag suggestions
  useEffect(() =>
  {
    let cancelled = false;
    getProfile(user._id)
      .then((p) => { if(!cancelled) setRecent(p.posts || []); })
      .catch(() => {});
    return() => { cancelled = true; };
  }, [user._id]);

  function handleDone(post)
  {
    setComposeOpen(false);
    toast("Your memory was shared");
    refreshData();
    if(location.pathname !== "/home") navigate(`/post/${post._id}`);
  }

  return(
    <Modal title="Share a Memory" onClose={() => setComposeOpen(false)}>
      <PostForm recentPosts={recent} onDone={handleDone} onCancel={() => setComposeOpen(false)} />
    </Modal>
  );
}

//navbar + page width for every page after logging in
function Layout({ children })
{
  const { composeOpen } = useUi();
  const location = useLocation();

  //start each new page at the top
  useEffect(() =>
  {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return(
    <>
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      {composeOpen && <ComposeModal />}
    </>
  );
}

function Loading()
{
  return(
    <div className="min-h-screen flex items-center justify-center">
      <img src="/images/logo.png" alt="Loading Pixel Memory" className="w-14 h-14 animate-pulse" />
    </div>
  );
}

//waits for the session check, then sends logged out visitors to the splash page
function PrivateRoute({ children, adminOnly = false })
{
  const { user, ready } = useAuth();
  const location = useLocation();

  if(!ready) return <Loading />;
  if(!user) return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  if(adminOnly && !user.isAdmin) return <Navigate to="/home" replace />;

  return <Layout>{children}</Layout>;
}

export default function App()
{
  const { user, ready } = useAuth();

  return(
    <Routes>
      {/* splash/landing page: no navbar */}
      <Route
        path="/"
        element={!ready ? <Loading /> : user ? <Navigate to="/home" replace /> : <SplashPage />}
      />

      <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/profile/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/post/:id" element={<PrivateRoute><PostPage /></PrivateRoute>} />
      <Route path="/album/:id" element={<PrivateRoute><AlbumPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
