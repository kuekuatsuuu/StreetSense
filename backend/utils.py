import cv2
import numpy as np

def process_image(image, model):
    """Processes a static image using YOLO and returns the processed image."""
    results = model(image)
    return visualize_pedestrians(image, results)

def process_webcam_frame(frame, model):
    """Processes a single frame from the webcam."""
    results = model(frame)
    visualize_pedestrians(frame, results)
    cv2.imshow("Pedestrian Detection", frame)  # Show real-time result

def visualize_pedestrians(image, results):
    """Draws bounding boxes and segmentation masks for pedestrians."""
    if image is None:
        raise ValueError("Invalid image input.")

    for result in results:
        if not hasattr(result, "masks") or result.masks is None or result.masks.data is None:
            continue

        for box, mask in zip(result.boxes, result.masks.data):
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = box.conf[0]
            cls = int(box.cls[0])

            if result.names[cls] != "person":
                continue

            label = f"{result.names[cls]} {conf:.2f}"

            # Draw bounding box
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Process mask
            mask_array = mask.cpu().numpy()
            mask_resized = cv2.resize(mask_array, (image.shape[1], image.shape[0]))
            mask_binary = (mask_resized > 0.5).astype(np.uint8)
            mask_color = np.zeros_like(image, dtype=np.uint8)
            mask_color[:, :, 1] = mask_binary * 255

            image = cv2.addWeighted(image, 1.0, mask_color, 0.5, 0)

    return image  # Return the processed image