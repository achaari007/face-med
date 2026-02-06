from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import face_recognition
import numpy as np
import json, os, shutil, uuid, io
from PIL import Image


app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/data", StaticFiles(directory="data"), name="data")


# ---------------- Paths ----------------
DATA_DIR = "data"
PATIENTS_FILE = f"{DATA_DIR}/patients.json"
FACES_FILE = f"{DATA_DIR}/faces.json"
UPLOADS_DIR = f"{DATA_DIR}/uploads"
MAPPING_FILE = f"{DATA_DIR}/mapping.json"
AUDIT_FILE = f"{DATA_DIR}/audit.json"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# ---------------- Helpers ----------------
def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def bytes_to_image(img_bytes: bytes):
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(image)

# ---------------- Health ----------------
@app.get("/health")
def health():
    return {"status": "ok"}

# ============================================================
# REGISTER PATIENT + FACE
# ============================================================
@app.post("/register-patient")
async def register_patient(
    name: str = Form(...),
    age: int = Form(...),
    blood_group: str = Form(...),
    face: UploadFile = File(...)
):
    img_bytes = await face.read()
    image = bytes_to_image(img_bytes)

    encodings = face_recognition.face_encodings(image)
    if len(encodings) != 1:
        raise HTTPException(400, "Exactly one face must be visible")

    patients = load_json(PATIENTS_FILE, {})
    faces = load_json(FACES_FILE, {})

    patient_id = str(uuid.uuid4())

    patients[patient_id] = {
        "name": name,
        "age": age,
        "blood_group": blood_group
    }
    faces[patient_id] = encodings[0].tolist()

    save_json(PATIENTS_FILE, patients)
    save_json(FACES_FILE, faces)

    return {
        "message": "Patient registered successfully",
        "patient_id": patient_id
    }

# ============================================================
# RECOGNIZE FACE
# ============================================================
@app.post("/recognize")
async def recognize(face: UploadFile = File(...)):
    img_bytes = await face.read()
    image = bytes_to_image(img_bytes)

    encodings = face_recognition.face_encodings(image)
    if len(encodings) != 1:
        raise HTTPException(400, "Exactly one face must be visible")

    unknown = encodings[0]
    patients = load_json(PATIENTS_FILE, {})
    faces = load_json(FACES_FILE, {})

    for pid, known in faces.items():
        match = face_recognition.compare_faces(
            [np.array(known)],
            unknown,
            tolerance=0.5
        )
        if match[0]:
            p = patients[pid]
            return {
                "patient_id": pid,
                "name": p["name"],
                "age": p["age"],
                "blood_group": p["blood_group"]
            }

    raise HTTPException(404, "Not Found")

# ============================================================
# UPLOAD MEDICAL RECORD
# ============================================================
@app.post("/upload-record/{patient_id}")
async def upload_record(
    patient_id: str,
    file: UploadFile = File(...),
    role: str = Form(...)
):
    patients = load_json(PATIENTS_FILE, {})
    if patient_id not in patients:
        raise HTTPException(404, "Patient not found")

    patient_dir = f"{UPLOADS_DIR}/{patient_id}"
    os.makedirs(patient_dir, exist_ok=True)

    file_path = f"{patient_dir}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    mapping = load_json(MAPPING_FILE, {})
    mapping.setdefault(patient_id, []).append(file.filename)
    save_json(MAPPING_FILE, mapping)

    audit = load_json(AUDIT_FILE, [])
    audit.append({
        "patient_id": patient_id,
        "action": "upload",
        "file": file.filename,
        "role": role
    })
    save_json(AUDIT_FILE, audit)

    return {
        "message": (
            "Uploaded successfully. Records visible to Doctors only."
            if role == "nurse"
            else "Uploaded successfully."
        )
    }

# ============================================================
# GET MEDICAL RECORDS (Doctor view)
# ============================================================
@app.get("/records/{patient_id}")
def get_records(patient_id: str):
    mapping = load_json(MAPPING_FILE, {})
    return {
        "files": mapping.get(patient_id, [])
    }
