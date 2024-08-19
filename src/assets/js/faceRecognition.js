import * as faceapi from 'face-api.js';

const emotionData = {};

// Load models
export async function loadModels(modelUrl) {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    console.log('ssdMobilenetv1 loaded');

    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
    console.log('faceLandmark68Net loaded');

    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
    console.log('faceRecognitionNet loaded');

    await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
    console.log('faceExpressionNet loaded');
  } catch (error) {
    console.error('Error loading models:', error);
  }
}

function detectMask(detection) {
  const landmarks = detection.landmarks;
  const nose = landmarks.getNose();
  const mouth = landmarks.getMouth();

  // Calculate the distance between the nose tip and the center of the mouth
  const noseTip = nose[3];
  const mouthCenter = mouth[14];
  const distance = Math.sqrt(
    Math.pow(noseTip.x - mouthCenter.x, 2) + Math.pow(noseTip.y - mouthCenter.y, 2)
  );

  // Calculate the face height
  const faceHeight = detection.detection.box.height;

  // If the nose-mouth distance is less than 15% of the face height, assume a mask is present
  console.log(distance / faceHeight);
  return distance / faceHeight < 0.15;
}

// Start video stream
export async function startVideo(videoElement, onSuccess, onError) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      onSuccess();
    };
  } catch (error) {
    console.error('Error accessing video stream:', error);
    onError(error);
  }
}


// Detect face from video and manually draw bounding boxes
export async function detectFaceFromVideo(videoElement, canvasElement, faceDescriptors, displayNames, updateNamesList) {
  const canvas = canvasElement;
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');

  setInterval(async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    // Improve input frame quality
    const frame = await preprocessFrame(videoElement);
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

    const detections = await faceapi.detectAllFaces(frame, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();

    if (detections.length > 0) {
      // Iterate through all detected faces
      for (const detection of detections) {
        // Get the dominant emotion
        // const emotion = getTopEmotion(detection.expressions);
        // Draw bounding box
        const { detection: { box } } = detection;

        // Extract and display cropped face
        const croppedFace = cropFace(videoElement, box);
        const hasMask = await detectMask(detection);
        console.log(hasMask);
        const threshold = hasMask ? 0.4 : 0.3; // Increase threshold when mask is present
        const bestMatch = findBestMatch(detection.descriptor, faceDescriptors, hasMask, threshold);
        //const threshold = 0.5;
        ctx.strokeStyle = bestMatch.distance < threshold ? 'green' : 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw landmarks
        // const landmarks = detection.landmarks;
        // landmarks.positions.forEach(position => {
        //   ctx.beginPath();
        //   ctx.arc(position.x, position.y, 2, 0, 2 * Math.PI);
        //   ctx.fillStyle = bestMatch.distance < threshold ? 'green' : 'red';
        //   ctx.fill();
        // });

        // Display emotion above the bounding box
        //  ctx.fillStyle = 'white';
        //  ctx.font = '16px Arial';
        //  ctx.fillText(emotion, box.x, box.y - 5);

        if (bestMatch.distance < threshold) {
          if (!emotionData[bestMatch.name]) {
            emotionData[bestMatch.name] = {};
          }

          // Update emotion data
          // console.log(detection);
          Object.entries(detection.expressions).forEach(([emotion, value]) => {
            emotionData[bestMatch.name][emotion] = Math.round(value * 100);
          });

          updateNamesList(bestMatch, croppedFace, emotionData[bestMatch.name]);
        }
      }
    }
  }, 100); // Check every 33ms (~30 frames per second)
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

function findBestMatch(descriptor, faceDescriptors, hasMask, threshold) {
  let bestMatch = { name: 'Unknown', distance: Infinity };

  // Define the range of the descriptor that corresponds to the upper face
  // These indices are approximate and may need adjustment
  const upperFaceStart = 0;
  const upperFaceEnd = hasMask ? 68 : descriptor.length; // Use only upper face if mask is detected

  // Function to calculate Euclidean distance
  const euclideanDistance = (a, b) => {
    return Math.sqrt(a.slice(upperFaceStart, upperFaceEnd).map((x, i) => {
      return Math.pow(x - b[i], 2);
    }).reduce((sum, now) => sum + now));
  };

  for (const [name, knownDescriptors] of Object.entries(faceDescriptors)) {
    for (const knownDescriptor of knownDescriptors) {
      const distance = euclideanDistance(descriptor, knownDescriptor);
      if (distance < bestMatch.distance) {
        bestMatch = { name, distance };
      }
    }
  }

  // Adjust threshold based on whether a mask is detected
  //const threshold = hasMask ? 0.6 : 0.5; // Increase threshold when mask is present
  if (bestMatch.distance > threshold) {
    bestMatch.name = 'Unknown';
  }

  return bestMatch;
}

// Load face descriptors from a dataset
// Load face descriptors from a dataset
export async function loadDataset(faceDescriptors) {
  const baseUrl = '/dataset'; // Adjust this path if needed

  try {
    // Fetch the JSON file containing names and filenames
    const response = await fetch('dataset/images.json'); // Update the path to your JSON file
    const data = await response.json();

    for (const [name, filenames] of Object.entries(data)) {
      faceDescriptors[name] = [];
      const folderUrl = `${baseUrl}/${name}`;

      for (const filename of filenames) {
        try {
          const img = await loadImage(`${folderUrl}/${filename}`);
          const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detections) {
            faceDescriptors[name].push(detections.descriptor);
          }
        } catch (error) {
          console.error(`Error loading or processing image: ${filename} for ${name}`, error);
          // Skip this image and continue with the next one
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching or parsing JSON file', error);
  }
}

// Utility function to load an image
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}


