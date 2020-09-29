import os
from src.hand_tracker import HandTracker
import cv2
import numpy as np
import math
from statistics import mean
from sklearn.preprocessing import normalize
import time
import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

#        8   12  16  20
#        |   |   |   |
#        7   11  15  19
#    4   |   |   |   |
#    |   6   10  14  18
#    3   |   |   |   |
#    |   5---9---13--17
#    2    \         /
#     \    \       /
#      1    \     /
#       \    \   /
#        ------0-


class HandGesture():

    def __init__(self):
        self.palm_model_path = "./models/palm_detection_without_custom_op.tflite"
        self.landmark_model_path = "./models/hand_landmark.tflite"
        self.anchors_path = "./models/anchors.csv"

        self.detector = HandTracker(self.palm_model_path, self.landmark_model_path, self.anchors_path,box_shift=0.2, box_enlarge=1.3)

        self.POINT_COLOR = (0, 255, 0)
        self.CONNECTION_COLOR = (255, 0, 0)
        self.THICKNESS = 2
        self.connections = [
            (0, 1), (1, 2), (2, 3), (3, 4),
            (5, 6), (6, 7), (7, 8),
            (9, 10), (10, 11), (11, 12),
            (13, 14), (14, 15), (15, 16),
            (17, 18), (18, 19), (19, 20),
            (0, 5), (5, 9), (9, 13), (13, 17), (0, 17)
        ]

        self.palm_pos = [0,0]
        self.gesture = "first"
        self.palm_depth = 0

    def get_pose(self, kp,box):
        x0, y0 = 0,0
        max_size = 400
        box_width = np.linalg.norm(box[1] - box[0])
        box_height = np.linalg.norm(box[3] - box[0])
        x1 = ((kp[:,0] - x0) * max_size) / box_width
        y1 = ((kp[:,1] - y0) * max_size) / box_height
        a = np.array([x1,y1])
        v = a.transpose().flatten()
        return normalize([v],norm='l2')[0]

    def updateGesture(self, frame):
        hand = self.detector(frame)

        if hand is not None :#and len(hand) > 0:
            points = hand['joints']
            box = hand['bbox']
            bkp = hand['base_joints']

            kp = self.get_pose(bkp,box)
            return kp
        return []

    @staticmethod
    def similarity(v1,v2):
        return np.dot(v1,v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    @staticmethod
    def cosineDistanceMatching(poseVector1, poseVector2):
          cosineSimilarity = HandGesture.similarity(poseVector1, poseVector2)
          distance = 2 * (1 - cosineSimilarity)
          return np.sqrt(distance)
