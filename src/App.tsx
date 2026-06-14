import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginModal from "./components/LoginModal";
import EventsPage from "./pages/EventsPage";
import UsersPage from "./pages/UsersPage";
import AskAiPage from "./pages/AskAiPage";
import NotFound from "./pages/NotFound";

function App() {
  // The login modal is opt-in: it only opens when the user clicks "Login". The
  // starter popped it up on every visit, which is hostile for a read-only demo
  // dashboard and trains users to dismiss auth prompts without reading them.
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />
          {/* Same workspace; the :id opens the detail drawer (deep-linkable). */}
          <Route path="/events/:id" element={<EventsPage />} />
          <Route path="/ask" element={<AskAiPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

export default App;
