import { useEffect, useRef, useState } from "react";

export default function Camera({ role, onRecognized }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  // Register form
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      });
  }, []);

  function captureImage() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
  }

  async function recognize() {
    setStatus("Recognizing...");
    const blob = await captureImage();
    const form = new FormData();
    form.append("face", blob);

    const res = await fetch("http://localhost:8000/recognize", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      setStatus("No matching face found");
      return;
    }

    const data = await res.json();
    onRecognized(data);
    setStatus("Face recognized");
  }

  async function savePatient() {
    const blob = await captureImage();
    const form = new FormData();
    form.append("name", name);
    form.append("age", age);
    form.append("blood_group", bloodGroup);
    form.append("face", blob);

    const res = await fetch("http://localhost:8000/register-patient", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      setStatus("Registration failed");
      return;
    }

    setShowRegister(false);
    setName("");
    setAge("");
    setBloodGroup("");
    setStatus("Patient registered. Ready to scan.");
  }

  function reset() {
    setStatus("");
    onRecognized(null);
  }

  return (
    <>
      <h3>📷 Live Camera</h3>

      <video
        ref={videoRef}
        autoPlay
        style={{ width: "100%", borderRadius: "10px" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Buttons */}
      <div style={{ marginTop: "15px" }}>
        <button onClick={recognize} style={btn("green")}>
          Recognize Face
        </button>
        <button onClick={() => setShowRegister(true)} style={btn("blue")}>
          Register
        </button>
        <button onClick={reset} style={btn("gray")}>
          Reset
        </button>
      </div>

      {/* Status */}
      {status && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            background: status.includes("recognized") ? "#e6fffa" : "#fdecea",
            borderRadius: "6px",
          }}
        >
          {status}
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Register Patient</h3>

            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <input
              placeholder="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            />

            <div style={{ marginTop: "10px" }}>
              <button onClick={savePatient} style={btn("blue")}>
                Save
              </button>
              <button
                onClick={() => setShowRegister(false)}
                style={btn("gray")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- styles ---------- */

const btn = (color) => ({
  marginRight: "10px",
  padding: "8px 14px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  background:
    color === "green"
      ? "#22c55e"
      : color === "blue"
      ? "#3b82f6"
      : "#9ca3af",
  color: "#fff",
});

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modal = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  width: "300px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};
