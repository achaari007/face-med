from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import shutil
import uuid
import json
import face_recognition

# -----------------------------
# Paths & Directories
# -----------------------------

UPLOAD_DIR = "data/uploads"
FACE_DIR = "data/faces"
MAPPING_FILE = "data/mapping.json"
PATIENT_FILE = "data/patients.json"
TEMP_FILE = "data/temp.jpg"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FACE_DIR, exist_ok=True)

for file in [MAPPING_FILE, PATIENT_FILE]:
    if not os.path.exists(file):
        with open(file, "w") as f:
            json.dump({}, f)

# -----------------------------
# App Setup
# -----------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Health Check
# -----------------------------

@app.get("/")
def root():
    return {"status": "backend running"}

# -----------------------------
# Medical Document Upload
# -----------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"message": "file uploaded", "filename": file.filename}

# -----------------------------
# Face Registration
# -----------------------------

@app.post("/register-face")
async def register_face(file: UploadFile = File(...)):
    face_id = f"{uuid.uuid4()}.jpg"
    path = os.path.join(FACE_DIR, face_id)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"message": "face registered", "face_id": face_id}

# -----------------------------
# Face Recognition
# -----------------------------

@app.post("/recognize-face")
async def recognize_face(file: UploadFile = File(...)):
    with open(TEMP_FILE, "wb") as f:
        shutil.copyfileobj(file.file, f)

    unknown_image = face_recognition.load_image_file(TEMP_FILE)
    unknown_encodings = face_recognition.face_encodings(unknown_image)

    if not unknown_encodings:
        return {"match": False, "reason": "no face detected"}

    unknown_encoding = unknown_encodings[0]

    for face_file in os.listdir(FACE_DIR):
        known_image = face_recognition.load_image_file(
            os.path.join(FACE_DIR, face_file)
        )
        known_encodings = face_recognition.face_encodings(known_image)

        if not known_encodings:
            continue

        match = face_recognition.compare_faces(
            [known_encodings[0]], unknown_encoding
        )[0]

        if match:
            return {"match": True, "face_id": face_file}

    return {"match": False}

# -----------------------------
# Face ↔ Medical Records
# -----------------------------

@app.post("/link-record")
def link_record(face_id: str, filename: str):
    with open(MAPPING_FILE, "r") as f:
        mapping = json.load(f)

    mapping.setdefault(face_id, [])
    if filename not in mapping[face_id]:
        mapping[face_id].append(filename)

    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=2)

    return {"records": mapping[face_id]}

@app.get("/records/{face_id}")
def get_records_for_face(face_id: str):
    with open(MAPPING_FILE, "r") as f:
        mapping = json.load(f)

    return {"records": mapping.get(face_id, [])}

# -----------------------------
# Patient Details
# -----------------------------

@app.post("/patient")
def save_patient(face_id: str, name: str, age: int, blood_group: str):
    with open(PATIENT_FILE, "r") as f:
        patients = json.load(f)

    patients[face_id] = {
        "name": name,
        "age": age,
        "blood_group": blood_group
    }

    with open(PATIENT_FILE, "w") as f:
        json.dump(patients, f, indent=2)

    return {"patient": patients[face_id]}

@app.get("/patient/{face_id}")
def get_patient(face_id: str):
    with open(PATIENT_FILE, "r") as f:
        patients = json.load(f)

    return patients.get(face_id, {})

# -----------------------------
# Download File
# -----------------------------

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": "file not found"}

    return FileResponse(file_path, filename=filename)
