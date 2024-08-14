import * as faceapi from 'face-api.js';

// Load models
export async function loadModels(modelUrl) {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
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
export async function detectFaceFromVideo(videoElement, canvasElement, faceDescriptors, displayNames, updateNamesList) {
  const canvas = canvasElement;
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const detections = await faceapi.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length > 0) {
      console.log(`Detected ${detections.length} face(s)`);

      // Manually draw bounding boxes and landmarks around detected faces
      detections.forEach(detection => {
        // Draw bounding box
        const { detection: { box } } = detection;
        console.log(box);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw landmarks
        const landmarks = detection.landmarks;
        landmarks.positions.forEach(position => {
          ctx.beginPath();
          ctx.arc(position.x, position.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = 'blue';
          ctx.fill();
        });
      });

      // Draw border around all faces
      drawBorderAroundFaces(ctx, detections);

      // Find best matches and update the names list
      for (const detection of detections) {
        const bestMatch = findBestMatch(detection.descriptor, faceDescriptors);
        if (bestMatch.distance < 0.5 && !displayNames.has(bestMatch.name)) {
          updateNamesList(bestMatch.name);
          displayNames.add(bestMatch.name);
        }
      }
    }
  }, 1000); // Check every second
}

// Find the best match for a given face descriptor
function findBestMatch(descriptor, faceDescriptors) {
  let bestMatch = { name: 'Unknown', distance: Infinity };

  for (const [name, descriptors] of Object.entries(faceDescriptors)) {
    for (const knownDescriptor of descriptors) {
      const distance = faceapi.euclideanDistance(descriptor, knownDescriptor);
      if (distance < bestMatch.distance) {
        bestMatch = { name, distance };
      }
    }
  }
  return bestMatch;
}

// Draw border around all detected faces
function drawBorderAroundFaces(ctx, detections) {
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 3;

  detections.forEach(detection => {
    const { detection: { box } } = detection;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  });
}

// Load face descriptors from a dataset
export async function loadDataset(names, baseUrl, faceDescriptors) {
  for (const name of names) {
    faceDescriptors[name] = [];
    const folderUrl = `${baseUrl}/${name}`;

    // Assuming fixed filenames for simplicity
    const filenames = [
      'face1.jpg', 'face2.jpg', 'face3.jpg' // Add all filenames you have
    ];

    for (const filename of filenames) {
      const img = new Image();
      img.src = `${folderUrl}/${filename}`;
      img.onload = async () => {
        const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
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
