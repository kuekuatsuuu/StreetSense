import cv2
import torch
import numpy as np
from ultralytics import YOLO
import json
import time

# Load YOLO segmentation model
model = YOLO("yolov8n-seg.pt")
model.fuse = lambda *args, **kwargs: model  # Prevent fusion error

# Risk classification thresholds
HIGH_RISK_SIZE_RATIO = 0.2  # Proportion of frame size for high risk
MEDIUM_RISK_SIZE_RATIO = 0.1  # Proportion of frame size for medium risk
MOVEMENT_THRESHOLD = 10  # Pixels moved per frame to classify as "moving"

# Store previous pedestrian positions
previous_positions = {}
pedestrian_id = 0  # Unique ID counter for tracking

# Session data tracking
session_data = {
    "totalPedestrians": 0,
    "highRisk": 0,
    "mediumRisk": 0,
    "lowRisk": 0,
    "pedestrians": []
}

# Reset session data
def reset_session_data():
    global session_data
    session_data = {
        "totalPedestrians": 0,
        "highRisk": 0,
        "mediumRisk": 0,
        "lowRisk": 0,
        "pedestrians": []
    }

def detect_pedestrian(frame):
    global previous_positions, pedestrian_id, session_data
    
    # Reset counts for this frame
    current_frame_data = {
        "totalPedestrians": 0,
        "highRisk": 0,
        "mediumRisk": 0,
        "lowRisk": 0
    }
    
    results = model(frame)  # Run segmentation model
    mask_overlay = np.zeros_like(frame, dtype=np.uint8)  # Empty overlay
    new_positions = {}  # Store positions of detected pedestrians
    frame_area = frame.shape[0] * frame.shape[1]
    
    for result in results:
        for i, box in enumerate(result.boxes):
            class_id = int(box.cls[0])  # Get class ID
            if class_id == 0:  # Only detect persons (ID = 0)
                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                bbox_size = (x2 - x1) * (y2 - y1)  # Approximate area of bounding box
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                confidence = float(box.conf[0])

                # Assign a unique ID for tracking
                pedestrian_id += 1
                new_positions[pedestrian_id] = (cx, cy)
                
                # Increment total pedestrian count
                current_frame_data["totalPedestrians"] += 1
                
                # Normalize risk classification by frame size
                risk_level = "low"
                if bbox_size / frame_area > HIGH_RISK_SIZE_RATIO:
                    risk_label = "HIGH RISK"
                    color = (0, 0, 255)  # Red
                    risk_level = "high"
                    current_frame_data["highRisk"] += 1
                elif bbox_size / frame_area > MEDIUM_RISK_SIZE_RATIO:
                    risk_label = "MEDIUM RISK"
                    color = (0, 255, 255)  # Yellow
                    risk_level = "medium"
                    current_frame_data["mediumRisk"] += 1
                else:
                    risk_label = "LOW RISK"
                    color = (0, 255, 0)  # Green
                    risk_level = "low"
                    current_frame_data["lowRisk"] += 1
                
                # Track movement to adjust risk
                if pedestrian_id in previous_positions:
                    px, py = previous_positions[pedestrian_id]
                    movement = np.sqrt((cx - px) ** 2 + (cy - py) ** 2)
                    if movement > MOVEMENT_THRESHOLD:
                        risk_label = "HIGH RISK (Moving)"
                        color = (0, 0, 255)
                        # If was previously counted as medium/low, adjust counts
                        if risk_level != "high":
                            if risk_level == "medium":
                                current_frame_data["mediumRisk"] -= 1
                            else:
                                current_frame_data["lowRisk"] -= 1
                            current_frame_data["highRisk"] += 1
                            risk_level = "high"

                # Store pedestrian data for API
                pedestrian_data = {
                    "id": f"ped_{int(time.time())}_{pedestrian_id}",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ", time.gmtime()),
                    "risk_level": risk_level,
                    "confidence": confidence,
                    "position_x": cx,
                    "position_y": cy,
                    "bbox": [x1, y1, x2, y2]
                }
                session_data["pedestrians"].append(pedestrian_data)

                # Draw bounding box & risk label
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, risk_label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                # Apply segmentation mask
                if hasattr(result, 'masks') and result.masks is not None:
                    mask = result.masks.data[i].cpu().numpy()
                    mask = (mask > 0.5).astype(np.uint8) * 255  # Convert to binary mask
                    mask_resized = cv2.resize(mask, (frame.shape[1], frame.shape[0]))

                    # Create translucent overlay
                    green_overlay = np.zeros_like(frame, dtype=np.uint8)
                    green_overlay[:, :] = (0, 255, 0)
                    mask_indices = mask_resized > 0
                    mask_overlay[mask_indices] = green_overlay[mask_indices]

    # Update session data with current frame data
    session_data["totalPedestrians"] = current_frame_data["totalPedestrians"]
    session_data["highRisk"] = current_frame_data["highRisk"]
    session_data["mediumRisk"] = current_frame_data["mediumRisk"]
    session_data["lowRisk"] = current_frame_data["lowRisk"]
    
    previous_positions = new_positions  # Update positions for tracking
    alpha = 0.5  # Adjust transparency level
    blended_frame = cv2.addWeighted(frame, 1, mask_overlay, alpha, 0)
    return blended_frame

def get_session_data():
    """Return the current session data as JSON"""
    return session_data

def generate_frames():
    cap = cv2.VideoCapture(0)  # Open webcam
    while True:
        success, frame = cap.read()
        if not success:
            break
        frame = detect_pedestrian(frame)  # Process frame
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()

running = False

def start_webcam():
    global running
    reset_session_data()  # Reset session data when starting webcam
    running = True
    generate_frames()  # Start webcam stream

def stop_webcam():
    global running
    running = False  # Stop loop
