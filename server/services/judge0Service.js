const axios = require("axios");

const BASE_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";

// ✅ Always use base64_encoded=true — Judge0 requires it when output has special chars
// We encode source_code and stdin as base64 when sending
// We decode stdout, stderr, compile_output when receiving

const b64Encode = (str) => Buffer.from(str || "").toString("base64");
const b64Decode = (str) => {
  if (!str) return "";
  try { return Buffer.from(str, "base64").toString("utf-8").trim(); }
  catch { return str.trim(); }
};

async function createSubmission(code, input, languageId) {
  const payload = {
    source_code: b64Encode(code),
    stdin:       b64Encode(input),
    language_id: Number(languageId)
  };

  console.log("[Judge0] Submitting with base64 | language_id:", payload.language_id);

  const res = await axios.post(
    `${BASE_URL}/submissions?base64_encoded=true&wait=false`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  console.log("[Judge0] Token:", res.data.token);
  return res.data.token;
}

async function getResult(token) {
  try {
    const res = await axios.get(
      `${BASE_URL}/submissions/${token}?base64_encoded=true`,  // ✅ receive as base64
      { headers: { "Content-Type": "application/json" } }
    );

    const data = res.data;

    // Decode all base64 fields before returning
    return {
      ...data,
      stdout:         b64Decode(data.stdout),
      stderr:         b64Decode(data.stderr),
      compile_output: b64Decode(data.compile_output),
      message:        b64Decode(data.message)
    };

  } catch (err) {
    if (err?.response?.data) {
      console.log("[Judge0] HTTP error with data:", err.response.status, err.response.data);
      const data = err.response.data;
      return {
        ...data,
        stdout:         b64Decode(data.stdout),
        stderr:         b64Decode(data.stderr),
        compile_output: b64Decode(data.compile_output),
        message:        b64Decode(data.message)
      };
    }
    throw err;
  }
}

module.exports = { createSubmission, getResult };