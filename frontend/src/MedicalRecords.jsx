import { useEffect, useState } from "react";

export default function MedicalRecords({ patient, role }) {
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");

  // Fetch records whenever patient OR role changes
  useEffect(() => {
    setFiles([]);
    setMsg("");

    if (!patient) return;

    if (role === "doctor") {
      fetch(`http://localhost:8000/records/${patient.patient_id}`)
        .then((res) => res.json())
        .then((data) => {
          setFiles(data.files || []);
        })
        .catch(() => {
          setFiles([]);
        });
    }
  }, [patient, role]);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file || !patient) return;

    const form = new FormData();
    form.append("file", file);
    form.append("role", role);

    try {
      const res = await fetch(
        `http://localhost:8000/upload-record/${patient.patient_id}`,
        { method: "POST", body: form }
      );

      const data = await res.json();
      setMsg(data.message);

      // If Doctor uploaded, refresh list immediately
      if (role === "doctor") {
        const r = await fetch(
          `http://localhost:8000/records/${patient.patient_id}`
        );
        const d = await r.json();
        setFiles(d.files || []);
      }
    } catch {
      setMsg("Upload failed");
    }
  };

  if (!patient) return null;

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>📁 Medical Records</h3>

      {/* Upload allowed for both roles */}
      <input
        type="file"
        accept="application/pdf"
        onChange={upload}
      />

      {msg && (
        <p style={{ marginTop: "10px", fontWeight: "bold" }}>
          {msg}
        </p>
      )}

      {/* Nurse restriction */}
      {role === "nurse" && (
        <p style={{ color: "#b45309", marginTop: "10px" }}>
          🔒 Medical records are restricted for Nurse role.
        </p>
      )}

      {/* Doctor view */}
      {role === "doctor" && (
        <div style={{ marginTop: "15px" }}>
          {files.length === 0 ? (
            <p>No medical records uploaded.</p>
          ) : (
            <ul>
              {files.map((file) => (
                <li key={file}>
                  <a
                    href={`http://localhost:8000/data/uploads/${patient.patient_id}/${file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline" }}
                  >
                    {file}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
