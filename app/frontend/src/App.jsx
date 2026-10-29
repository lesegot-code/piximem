import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navigation from "./components/Navigation.jsx";
import SplashPage from "./pages/SplashPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PostPage from "./pages/PostPage.jsx";
import NotFound from "./pages/NotFound.jsx";

//wrapper to hide the navbar on the splash page
function Layout({ children }) 
{
  const { user } = useAuth();
  return(
    <>
      {user && <Navigation />}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}

//route guard - redirect to "/" if not logged in
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Splash: no navbar */}
      <Route 
        path="/"
        element={user ? <Navigate to="/home" replace /> : <SplashPage />}
      />

      {/* everything has navbar */}
      <Route
        path="/home"
        element={<PrivateRoute><Layout><HomePage /></Layout></PrivateRoute>}
      />
      <Route
        path="/profile/:id"
        element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>}
      />
      <Route
        path="/post/:id"
        element={<PrivateRoute><Layout><PostPage /></Layout></PrivateRoute>}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}