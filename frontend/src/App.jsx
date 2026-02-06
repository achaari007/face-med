import { useState } from "react";
import Camera from "./Camera";
import MedicalRecords from "./MedicalRecords";

export default function App() {
  const [role, setRole] = useState("doctor");
  const [patient, setPatient] = useState(null);

  return (
    <div style={{ background: "#f4f6f8", minHeight: "100vh", padding: "40px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{ marginBottom: "10px" }}>Face-Med</h1>

        {/* Role Switch */}
        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <strong>Access Role:</strong>{" "}
          <label style={{ marginLeft: "10px" }}>
            <input
              type="radio"
              checked={role === "doctor"}
              onChange={() => setRole("doctor")}
            />{" "}
            Doctor (Full Access)
          </label>
          <label style={{ marginLeft: "15px" }}>
            <input
              type="radio"
              checked={role === "nurse"}
              onChange={() => setRole("nurse")}
            />{" "}
            Nurse (Limited Access)
          </label>
        </div>

        {/* Camera Card */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <Camera role={role} onRecognized={setPatient} />
        </div>

        {/* Patient + Records */}
        {patient && (
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
            }}
          >
            <h3>👤 Patient Details</h3>
            <p><strong>Name:</strong> {patient.name}</p>
            <p><strong>Age:</strong> {patient.age}</p>
            <p><strong>Blood Group:</strong> {patient.blood_group}</p>

            <MedicalRecords patient={patient} role={role} />
          </div>
        )}
      </div>
    </div>
  );
}
