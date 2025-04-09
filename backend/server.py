from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import cv2
import threading
import os
from main import detect_pedestrian, start_webcam, stop_webcam, get_session_data, reset_session_data

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow frontend requests

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

webcam_active = False
video_stream = None

@app.route("/", methods=["GET"])
def home():
    return "Flask server is running!"

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(file_path)

    # Run pedestrian detection
    detected_image_path = detect_pedestrian(file_path)

    if detected_image_path is None:
        return jsonify({"error": "Image processing failed"}), 500

    return jsonify({"message": "Processing successful", "image_path": detected_image_path})

@app.route("/start_webcam", methods=["POST"])
def start_webcam_feed():
    global webcam_active, video_stream
    if not webcam_active:
        webcam_active = True
        reset_session_data()  # Reset session data
        video_stream = threading.Thread(target=start_webcam, daemon=True)
        video_stream.start()
        return jsonify({"message": "Webcam started"})
    return jsonify({"message": "Webcam already running"})

@app.route("/stop_webcam", methods=["POST"])
def stop_webcam_feed():
    global webcam_active
    if webcam_active:
        webcam_active = False
        stop_webcam()
        return jsonify({"message": "Webcam stopped"})
    return jsonify({"message": "Webcam not running"})

@app.route("/session_data", methods=["GET"])
def session_data():
    """Return current session data"""
    return jsonify(get_session_data())

@app.route("/video_feed")
def video_feed():
    def generate_frames():
        global webcam_active
        cap = cv2.VideoCapture(0)
        while webcam_active:
            success, frame = cap.read()
            if not success:
                break
            processed_frame = detect_pedestrian(frame)
            _, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        cap.release()

    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(debug=True)
