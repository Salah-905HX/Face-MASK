import cv2
import mediapipe as mp

image = cv2.imread("test.png")

mp_face_mesh = mp.solutions.face_mesh

with mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.1,
    min_tracking_confidence=0.1
) as face_mesh:

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb)

    if results.multi_face_landmarks:
        print("FACE DETECTED")
    else:
        print("NO FACE")