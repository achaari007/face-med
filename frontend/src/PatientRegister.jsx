import { useRef, useState } from "react";

function PatientRegister({ onDone }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // Start camera
  // ----------------------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      setError("Unable to access camera");
    }
  };

  // ----------------------------
  // Capture frame & submit
  // ----------------------------
  const handleRegister = async () => {
    setError("");

    if (!name || !age || !bloodGroup) {
      setError("All patient details are required");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    if (!blob) {
      setError("Failed to capture image");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("age", age);
    formData.append("blood_group", bloodGroup);
    formData.append("face", blob, "face.jpg");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8000/register-patient", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      alert("Patient registered successfully");
      stopCamera();
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Stop camera
  // ----------------------------
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div>
      <h2>Register Patient</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Blood Group"
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={startCamera}>Start Camera</button>
      </div>

      <video
        ref={videoRef}
        style={{ width: "300px", border: "1px solid black" }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Save Patient"}
        </button>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
      )}
    </div>
  );
}

export default PatientRegister;
