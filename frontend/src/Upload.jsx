import { useState } from "react";

export default function Upload({ patientId, role, records, onUploaded }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  async function upload() {
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("role", role);

    const res = await fetch(
      `http://localhost:8000/upload-record/${patientId}`,
      {
        method: "POST",
        body: form,
      }
    );

    const data = await res.json();
    setMsg(data.message);
    setFile(null);
    onUploaded(); // refresh record list
  }

  return (
    <div style={card}>
      <h3>📁 Medical Records</h3>

      {/* Upload */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={upload} style={btn}>
          Upload
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={msgStyle(role)}>
          {msg}
        </div>
      )}

      {/* Record List */}
      {role === "doctor" ? (
        records?.length ? (
          <ul>
            {records.map((f) => (
              <li key={f}>
                📄{" "}
                <a
                  href={`http://localhost:8000/data/uploads/${patientId}/${f}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {f}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No records uploaded</p>
        )
      ) : (
        <div style={lockBox}>
          🔒 Medical records are restricted for Nurse role.
        </div>
      )}
    </div>
  );
}

/* ---------- styles ---------- */

const card = {
  marginTop: "20px",
  padding: "15px",
  borderRadius: "12px",
  background: "#fff",
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
};

const btn = {
  marginLeft: "10px",
  padding: "6px 12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const msgStyle = (role) => ({
  marginBottom: "10px",
  padding: "8px",
  borderRadius: "6px",
  background: role === "nurse" ? "#fff7ed" : "#ecfeff",
  color: "#065f46",
});

const lockBox = {
  marginTop: "10px",
  padding: "10px",
  background: "#fef2f2",
  borderRadius: "6px",
};
