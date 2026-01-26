import { useEffect, useRef, useState } from "react";

function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [role, setRole] = useState("doctor"); // doctor | nurse
  const [records, setRecords] = useState([]);
  const [patient, setPatient] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  const resetUI = () => {
    setRecords([]);
    setPatient(null);
    setStatus("");
    setStatusType("");
    setLoading(false);
  };

  const captureAndSend = async (endpoint) => {
    setLoading(true);
    setStatusType("info");
    setStatus("Processing...");
    setRecords([]);
    setPatient(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    const formData = new FormData();
    formData.append("file", blob, "face.jpg");

    try {
      const res = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        body: formData
      });

      const result = await res.json();

      if (endpoint === "register-face") {
        setStatus("Face registered successfully");
        setStatusType("success");
      }

      if (endpoint === "recognize-face") {
        if (!result.match) {
          setStatus(
            result.reason
              ? "Multiple or no faces detected. Please ensure only one face."
              : "No matching face found"
          );
          setStatusType("error");
          setLoading(false);
          return;
        }

        setStatus("Face recognized");
        setStatusType("success");

        const patientRes = await fetch(
          `http://localhost:8000/patient/${result.face_id}`
        );
        setPatient(await patientRes.json());

        if (role === "doctor") {
          const recRes = await fetch(
            `http://localhost:8000/records/${result.face_id}`
          );
          const recData = await recRes.json();
          setRecords(recData.records || []);
        }
      }
    } catch (err) {
      setStatus("Server error. Please try again.");
      setStatusType("error");
    }

    setLoading(false);
  };

  const confirmRegister = () => {
    const ok = window.confirm(
      "Register this face?\nThis will store biometric data."
    );
    if (ok) captureAndSend("register-face");
  };

  return (
    <div style={container}>
      <h1 style={{ textAlign: "center" }}>🩺 Face-Med</h1>
      <p style={{ textAlign: "center", color: "#666" }}>
        Face-Based Medical Record Access
      </p>

      {/* ROLE TOGGLE */}
      <div style={roleCard}>
        <strong>👨‍⚕️ Access Role:</strong>
        <label style={roleLabel}>
          <input
            type="radio"
            checked={role === "doctor"}
            onChange={() => setRole("doctor")}
          />{" "}
          Doctor (Full Access)
        </label>
        <label style={roleLabel}>
          <input
            type="radio"
            checked={role === "nurse"}
            onChange={() => setRole("nurse")}
          />{" "}
          Nurse (Limited Access)
        </label>
      </div>

      {/* CAMERA CARD */}
      <div style={card}>
        <h3>📷 Live Camera</h3>
        <video ref={videoRef} autoPlay width="100%" style={videoStyle} />

        <div style={{ marginTop: 12 }}>
          <button
            disabled={loading}
            onClick={confirmRegister}
            style={primaryBtn}
          >
            Register Face
          </button>

          <button
            disabled={loading}
            onClick={() => captureAndSend("recognize-face")}
            style={secondaryBtn}
          >
            Recognize Face
          </button>

          <button disabled={loading} onClick={resetUI} style={resetBtn}>
            Reset
          </button>
        </div>

        {status && (
          <div style={{ ...statusBox, ...statusColors[statusType] }}>
            {loading ? "⏳ " : ""}
            {status}
          </div>
        )}
      </div>

      {/* PATIENT CARD */}
      {patient && patient.name && (
        <div style={card}>
          <h3>👤 Patient Details</h3>
          <p><b>Name:</b> {patient.name}</p>
          <p><b>Age:</b> {patient.age}</p>
          <p><b>Blood Group:</b> {patient.blood_group}</p>
        </div>
      )}

      {/* RECORDS CARD (Doctor Only) */}
      {role === "doctor" && records.length > 0 && (
        <div style={card}>
          <h3>📁 Medical Records</h3>
          <ul>
            {records.map((rec, i) => (
              <li key={i}>
                <a
                  href={`http://localhost:8000/download/${rec}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  📄 {rec}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {role === "nurse" && patient && (
        <div style={noteBox}>
          🔒 Medical records are restricted for Nurse role.
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const container = {
  maxWidth: "760px",
  margin: "30px auto",
  fontFamily: "Segoe UI, Arial, sans-serif"
};

const card = {
  background: "#fff",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "20px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.08)"
};

const roleCard = {
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
};

const roleLabel = {
  marginLeft: "14px",
  cursor: "pointer"
};

const videoStyle = {
  borderRadius: "12px",
  border: "1px solid #ddd"
};

const primaryBtn = {
  padding: "8px 14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

const secondaryBtn = {
  ...primaryBtn,
  background: "#059669",
  marginLeft: "8px"
};

const resetBtn = {
  ...primaryBtn,
  background: "#6b7280",
  marginLeft: "8px"
};

const statusBox = {
  marginTop: "12px",
  padding: "10px",
  borderRadius: "6px",
  fontWeight: "500"
};

const noteBox = {
  marginTop: "15px",
  padding: "10px",
  borderRadius: "6px",
  background: "#fff7ed",
  color: "#9a3412"
};

const statusColors = {
  success: { background: "#dcfce7", color: "#166534" },
  error: { background: "#fee2e2", color: "#991b1b" },
  info: { background: "#e0f2fe", color: "#075985" }
};

export default Camera;
