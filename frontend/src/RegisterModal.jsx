import { useRef, useState } from "react";

export default function RegisterModal({ onClose, onSaved }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [error, setError] = useState("");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch {
      setError("Unable to access camera");
    }
  };

  const savePatient = async () => {
    setError("");

    if (!name || !age || !bloodGroup) {
      setError("All fields are required");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    const formData = new FormData();
    formData.append("name", name);
    formData.append("age", age);
    formData.append("blood_group", bloodGroup);
    formData.append("face", blob, "face.jpg"); // ✅ MUST be "face"

    try {
      const res = await fetch("http://localhost:8000/register-patient", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Register Patient</h2>

        <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Age"
          type="number"
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          placeholder="Blood Group"
          onChange={(e) => setBloodGroup(e.target.value)}
        />

        <button onClick={startCamera}>Start Camera</button>

        <video
          ref={videoRef}
          style={{ width: "100%", marginTop: 10 }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ marginTop: 10 }}>
          <button onClick={savePatient}>Save</button>
          <button onClick={onClose} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  background: "#fff",
  padding: "20px",
  width: "400px",
  borderRadius: "8px",
};
