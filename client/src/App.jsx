import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Problems from "./pages/Problems";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProblemPage from "./pages/ProblemPage";
import ContestTracker from "./pages/ContestTracker";
import SubmissionDetail from "./pages/SubmissionDetail";
import ContestListPage from "./pages/ContestListPage";
import ContestDetail from "./pages/ContestDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProblemForm from "./pages/AdminProblemForm";
import AdminContestForm from "./pages/AdminContestForm";
import ContestArena from "./pages/ContestArena";
import ContestDashboard from "./pages/ContestDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import LiveContestMonitor from "./pages/LiveContestMonitor";
import PlagiarismReview from "./pages/PlagiarismReview";
import PricingPage from "./pages/PricingPage";             // ← NEW

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  const role  = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" />;
  if (role !== "admin") return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"      element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* ── Public but better when logged in ── */}
        <Route path="/pricing" element={<PricingPage />} />  {/* ← NEW */}

        {/* ── Private routes ── */}
        <Route path="/problems"             element={<PrivateRoute><Problems /></PrivateRoute>} />
        <Route path="/problems/slug/:slug"  element={<PrivateRoute><ProblemPage /></PrivateRoute>} />
        <Route path="/contests"             element={<PrivateRoute><ContestTracker /></PrivateRoute>} />
        <Route path="/contests-list"        element={<PrivateRoute><ContestListPage /></PrivateRoute>} />
        <Route path="/contest/:id"          element={<PrivateRoute><ContestDetail /></PrivateRoute>} />
        <Route path="/profile"              element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/submission/:id"       element={<PrivateRoute><SubmissionDetail /></PrivateRoute>} />
        <Route path="/contest-arena/:id"    element={<PrivateRoute><ContestArena /></PrivateRoute>} />

        {/* ── Admin routes ── */}
        <Route path="/admin/dashboard"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/problems/new"                 element={<AdminRoute><AdminProblemForm /></AdminRoute>} />
        <Route path="/admin/problems/edit/:id"            element={<AdminRoute><AdminProblemForm /></AdminRoute>} />
        <Route path="/admin/contests/new"                 element={<AdminRoute><AdminContestForm /></AdminRoute>} />
        <Route path="/admin/contests/edit/:id"            element={<AdminRoute><AdminContestForm /></AdminRoute>} />
        <Route path="/admin/analytics"                    element={<AnalyticsDashboard />} />
        <Route path="/admin/contests/live/:id"            element={<LiveContestMonitor />} />
        <Route path="/admin/plagiarism-review/:contestId" element={<PlagiarismReview />} />
        <Route path="/contest-dashboard"                  element={<ContestDashboard />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}