import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs-core';

// Load models
export async function loadModels(modelUrl) {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl), // More robust face detector
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
  ]);
  console.log('Models loaded');
}

// Start video stream
export function startVideo(videoElement, onSuccess, onError) {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      videoElement.srcObject = stream;
      videoElement.play();
      if (onSuccess) onSuccess();
    })
    .catch(error => {
      console.error('Error accessing webcam:', error);
      if (onError) onError(error);
    });
}

// Detect face from video and manually draw bounding boxes
export async function detectFaceFromVideo(videoElement, canvasElement, faceDescriptors, displayNames, updateNamesList, emotionModel) {
  console.log(emotionModel)
  const canvas = canvasElement;
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    // Improve input frame quality
    const frame = await preprocessFrame(videoElement);
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

    const detections = await faceapi.detectAllFaces(frame, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length > 0) {
      console.log(`Detected ${detections.length} face(s)`);

      // Iterate through all detected faces
      for (const detection of detections) {
        const { detection: { box } } = detection;

        // Extract and display cropped face
        const croppedFace = cropFace(videoElement, box);
        const bestMatch = findBestMatch(detection.descriptor, faceDescriptors);
        console.log(bestMatch);
        const threshold = 0.4;
        ctx.strokeStyle = bestMatch.distance < threshold ? 'green' : 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Emotion detection
        const emotion = await detectEmotion(croppedFace, emotionModel);
        console.log(`Detected emotion: ${emotion}`);

        // Display name and emotion
        if (bestMatch.distance < threshold && !displayNames.has(bestMatch.name)) {
          updateNamesList(bestMatch.name, croppedFace, emotion);
          displayNames.add(bestMatch.name);
        }
      }
    }
  }, 33); // Check every 33ms (~30 frames per second)
}

// Detect emotion from cropped face
async function detectEmotion(croppedFace, model) {
  const img = new Image();
  img.src = croppedFace;
  await img.decode();
  console.log(model)

  const tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([112, 112]).toFloat().expandDims(0);
  const prediction = model.predict(tensor);
  const emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'];
  const predictedEmotion = emotions[prediction.argMax(-1).dataSync()[0]];

  return predictedEmotion;
}


// Preprocess frame to improve detection quality
async function preprocessFrame(videoElement) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  tempCanvas.width = videoElement.videoWidth;
  tempCanvas.height = videoElement.videoHeight;

  // Resize and adjust contrast/brightness
  tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
  // Apply any additional preprocessing steps here (e.g., grayscale, brightness adjustment)

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.putImageData(imageData, 0, 0);

  return tempCanvas;
}

// Crop face from the video based on bounding box
function cropFace(videoElement, box) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  tempCanvas.width = box.width;
  tempCanvas.height = box.height;

  tempCtx.drawImage(
    videoElement,
    box.x, box.y, box.width, box.height,
    0, 0, box.width, box.height
  );

  return tempCanvas.toDataURL('image/png'); // Return the cropped face as a data URL
}

// Find the best match for a given face descriptor
function findBestMatch(descriptor, faceDescriptors) {
  let bestMatch = { name: 'Unknown', distance: Infinity };

  for (const [name, descriptors] of Object.entries(faceDescriptors)) {
    for (const knownDescriptor of descriptors) {
      const distance = faceapi.euclideanDistance(descriptor, knownDescriptor);
      if (distance < bestMatch.distance) {
        // console.log(bestMatch)
        bestMatch = { name, distance };
      }
    }
  }
  return bestMatch;
}

// Load face descriptors from a dataset
export async function loadDataset(faceDescriptors) {
  const names = ['khanhvq', 'tuyenbq']; // List of known names
  const baseUrl = '/dataset'; // Adjust this path if needed
  for (const name of names) {
    faceDescriptors[name] = [];
    const folderUrl = `${baseUrl}/${name}`;

    // Assuming fixed filenames for simplicity
    const filenames = [
      'face1.jpg', 'face2.jpg', 'face3.jpg','face4.jpg','face5.jpg','face6.jpg','face7.jpg','face8.jpg','face9.jpg','face10.jpg','face11.jpg','face12.jpg','face13.jpg','face14.jpg','face15.jpg','face16.jpg','face17.jpg','face18.jpg'
    ];

    for (const filename of filenames) {
      const img = new Image();
      img.src = `${folderUrl}/${filename}`;
      img.onload = async () => {
        const detections = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections) {
          faceDescriptors[name].push(detections.descriptor);
          console.log(`Loaded descriptor for ${name}`);
        }
      };
    }
  }
}
