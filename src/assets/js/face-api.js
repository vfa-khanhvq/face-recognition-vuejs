import * as faceapi from 'face-api.js';

// Load models
async function loadFaceApiModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
}

// Detect faces in an image
async function detectFaces(inputImage) {
    const detections = await faceapi.detectAllFaces(inputImage)
        .withFaceLandmarks()
        .withFaceDescriptors();
    return detections;
}
