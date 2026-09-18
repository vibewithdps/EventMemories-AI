# Event Memories — AI Face-Recognition Photo & Video Sharing Platform

> **Engineered by Dipendra Pratap Singh** — Full-Stack Developer & Data Scientist.

A high-performance, privacy-first web application for live events and weddings. Guests can simply scan their face via webcam or upload a selfie, and our AI engine instantly filters hundreds of shared event photos and videos to find and display **only the moments featuring them**.

---

## 🌟 Key Highlights

- **Deep Learning Face Recognition**: Powered by OpenCV ONNX neural networks:
  - **YuNet**: Real-time 5-point facial landmark detector (`face_detection_yunet.onnx`).
  - **SFace**: 128-dimensional L2-normalized deep face embedding model (`face_recognition_sface.onnx`).
- **Webcam Liveness & Anti-Spoofing**: Multi-frame micro-motion verification prevents photo printout spoofing.
- **Biometric Privacy by Design**: Only mathematical vector embeddings are stored. No raw biometric face scans are retained on disk.
- **Dynamic Event Management**: Admin can create, configure, and publish events with custom schedules, venues, and live countdowns.
- **Cryptographic Security**: HMAC-SHA256 time-limited signed URLs (15-minute TTL) with strict authorization checks.
- **One-Click Batch ZIP Download**: Guests can export all their verified photos in a single ZIP archive.
- **Admin Studio**: Bulk drag-and-drop uploader with automatic background face indexing, unsupervised face clustering, and biometric purge controls.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Lucide Icons, Canvas Confetti
- **Backend**: Python 3.14, FastAPI, Uvicorn, OpenCV Deep Learning (`FaceDetectorYN`, `FaceRecognizerSF`), NumPy, Pillow, Bcrypt, Python-Jose (JWT)
- **Database**: SQLite (local development) / PostgreSQL / Supabase ready
- **Storage**: Local signed media streaming / Cloud storage ready

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
./run_backend.sh
```

- API Server: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Web Application: `http://localhost:5173`

---

## 🔐 Admin Credentials

- **Email**: `thakurdps795@gmail.com`
- **Password**: `788052`

---

## 📜 License

MIT License — Built with ❤️ by **Dipendra Pratap Singh**.
