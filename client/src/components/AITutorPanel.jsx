import React, { useState } from "react";
import {
  Drawer,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  Alert
} from "@mui/material";
import API from "../services/api";

export default function AITutorPanel({ open, onClose, problem, code }) {

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  /* ================= SAFE API CALL ================= */

  const callAI = async (url, body) => {

    // 🚨 prevent undefined problemId request (THIS caused your 403)
    if (!problem || !problem._id) {
      setResponse("Problem is still loading... Please wait a moment and try again.");
      return;
    }

    try {
      setLoading(true);
      setResponse("");

      const res = await API.post(url, body);

      setResponse(
        res.data.hint ||
        res.data.review ||
        res.data.solution ||
        "AI could not generate a response."
      );

    } catch (err) {
      console.log("AI ERROR:", err);

      setResponse(
        err.response?.data?.message ||
        "AI tutor failed to respond. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= BUTTON ACTIONS ================= */

  // Explain
  const explain = () => {
    callAI("/ai/hint", {
      problemId: problem._id,
      level: 0,
      description: problem.description
    });
  };

  // Hints
  const getHint = (lvl) => {
    callAI("/ai/hint", {
      problemId: problem._id,
      level: lvl,
      description: problem.description
    });
  };

  // Debug
  const debug = () => {
    callAI("/ai/debug", {
      problemId: problem._id,
      description: problem.description,
      code
    });
  };

  // Solution
  const solution = () => {
    callAI("/ai/solution", {
      problemId: problem._id,
      description: problem.description
    });
  };

  /* ================= UI ================= */

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 2 }}>

        <Typography variant="h5" mb={2}>
          AI Tutor
        </Typography>

        {/* Tabs */}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
          <Tab label="Explain" />
          <Tab label="Hints" />
          <Tab label="Debug" />
          <Tab label="Solution" />
        </Tabs>

        <Divider sx={{ my: 2 }} />

        {/* EXPLAIN */}
        {tab === 0 && (
          <Button
            fullWidth
            variant="contained"
            onClick={explain}
            disabled={!problem || loading}
          >
            Explain Question
          </Button>
        )}

        {/* HINTS */}
        {tab === 1 && (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button disabled={!problem || loading} onClick={() => getHint(1)}>Hint 1</Button>
            <Button disabled={!problem || loading} onClick={() => getHint(2)}>Hint 2</Button>
            <Button disabled={!problem || loading} onClick={() => getHint(3)}>Hint 3</Button>
          </Box>
        )}

        {/* DEBUG */}
        {tab === 2 && (
          <Button
            color="warning"
            variant="contained"
            fullWidth
            onClick={debug}
            disabled={!problem || loading}
          >
            Analyze My Code
          </Button>
        )}

        {/* SOLUTION */}
        {tab === 3 && (
          <Button
            color="error"
            variant="contained"
            fullWidth
            onClick={solution}
            disabled={!problem || loading}
          >
            View Solution
          </Button>
        )}

        <Divider sx={{ my: 2 }} />

        {/* RESPONSE AREA */}
        <Box sx={{ whiteSpace: "pre-wrap", minHeight: 200 }}>

          {loading && (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          )}

          {!loading && response && (
            <Alert severity="info">
              {response}
            </Alert>
          )}

          {!loading && !response && (
            <Typography color="text.secondary">
              Ask the AI tutor for help with this problem.
            </Typography>
          )}

        </Box>

      </Box>
    </Drawer>
  );
}
