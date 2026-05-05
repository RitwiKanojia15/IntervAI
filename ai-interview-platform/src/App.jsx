import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StatsProvider } from "./context/StatsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing      from "./pages/Landing";
import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import Interview    from "./pages/Interview";
import Analytics    from "./pages/Analytics";
import QuestionBank from "./pages/QuestionBank";
import DSASolver    from "./pages/DSASolver";
import OpenPractice from "./pages/OpenPractice";
import VersantTest  from "./pages/VersantTest";
import AuthCallback  from "./pages/AuthCallback";
import GTGLobby     from "./pages/gtg/GTGLobby";
import GTGRoom      from "./pages/gtg/GTGRoom";
import GTGResults   from "./pages/gtg/GTGResults";
import GDLobby      from "./pages/gd/GDLobby";
import GDRoom       from "./pages/gd/GDRoom";
import GDResults    from "./pages/gd/GDResults";
import Leaderboard  from "./pages/Leaderboard";
import Profile      from "./pages/Profile";
import Settings     from "./pages/Settings";
import TakeTestSelection from "./pages/test/TakeTestSelection";
import TakeTestSession   from "./pages/test/TakeTestSession";
import TakeTestResults   from "./pages/test/TakeTestResults";
import LiveTestLobby from "./pages/live/LiveTestLobby";
import LiveTestSession from "./pages/live/LiveTestSession";
import LiveTestLeaderboard from "./pages/live/LiveTestLeaderboard";

const Wrap = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function App() {
  return (
    <AuthProvider>
      <StatsProvider>
      <Router>
        <Routes>
          <Route path="/"              element={<Landing />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard"     element={<Wrap><Dashboard /></Wrap>} />
          <Route path="/upload-resume" element={<Wrap><ResumeUpload /></Wrap>} />
          <Route path="/resume"        element={<Wrap><ResumeUpload /></Wrap>} />
          <Route path="/take-test"     element={<Wrap><TakeTestSelection /></Wrap>} />
          <Route path="/take-test/session" element={<Wrap><TakeTestSession /></Wrap>} />
          <Route path="/take-test/results" element={<Wrap><TakeTestResults /></Wrap>} />
          <Route path="/live-tests"    element={<Wrap><LiveTestLobby /></Wrap>} />
          <Route path="/live-tests/session" element={<Wrap><LiveTestSession /></Wrap>} />
          <Route path="/live-tests/leaderboard" element={<Wrap><LiveTestLeaderboard /></Wrap>} />
          <Route path="/interview"     element={<Wrap><Interview /></Wrap>} />
          <Route path="/analytics"     element={<Wrap><Analytics /></Wrap>} />
          <Route path="/question-bank" element={<Wrap><QuestionBank /></Wrap>} />
          <Route path="/question-bank/:id" element={<Wrap><DSASolver /></Wrap>} />
          <Route path="/practice/:id" element={<Wrap><OpenPractice /></Wrap>} />
          <Route path="/versant"       element={<Wrap><VersantTest /></Wrap>} />
          <Route path="/gtg"           element={<Wrap><GTGLobby /></Wrap>} />
          <Route path="/gtg/room/:roomId"    element={<Wrap><GTGRoom /></Wrap>} />
          <Route path="/gtg/results/:roomId" element={<Wrap><GTGResults /></Wrap>} />
          <Route path="/gd"            element={<Wrap><GDLobby /></Wrap>} />
          <Route path="/gd/room/:roomId"     element={<Wrap><GDRoom /></Wrap>} />
          <Route path="/gd/results/:roomId"  element={<Wrap><GDResults /></Wrap>} />
          <Route path="/leaderboard"   element={<Wrap><Leaderboard /></Wrap>} />
          <Route path="/profile"       element={<Wrap><Profile /></Wrap>} />
          <Route path="/settings"      element={<Wrap><Settings /></Wrap>} />
          <Route path="/achievements"  element={<Wrap><Profile /></Wrap>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </StatsProvider>
    </AuthProvider>
  );
}

export default App;
