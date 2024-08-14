<template>
  <div>
    <h1>Face Recognition</h1>
    <div class="image-uploads">
      <div class="image-container" v-for="index in 2" :key="index">
        <input type="file" @change="handleFileUpload(index)">
        <div v-if="images[index-1]" class="preview-wrapper">
          <img :src="images[index-1]" :alt="`Image ${index}`" class="preview-image">
          <canvas :ref="`canvas${index}`" class="landmark-canvas"></canvas>
        </div>
      </div>
    </div>
    <div v-if="comparisonResult" class="comparison-result">
      <h2>Comparison Result:</h2>
      <pre>{{ JSON.stringify(comparisonResult, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import * as faceapi from 'face-api.js';

export default {
  data() {
    return {
      modelsLoaded: false,
      faceDescriptors: [null, null],
      images: [null, null],
      comparisonResult: null,
    };
  },
  async mounted() {
    try {
      await this.loadModels();
      this.modelsLoaded = true;
      console.log('Models loaded successfully');
    } catch (error) {
      console.error('Error loading models:', error);
    }
  },
  methods: {
    async loadModels() {
      const modelUrl = '/models'; // Adjust this path to your models folder
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl),
      ]);
    },
    async handleFileUpload(index) {
      if (!this.modelsLoaded) {
        console.error('Models are not loaded');
        return;
      }

      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        this.images[index - 1] = e.target.result;
        const img = await faceapi.fetchImage(e.target.result);
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          this.faceDescriptors[index - 1] = detections[0].descriptor;
          this.drawLandmarks(img, detections[0], index);

          if (this.faceDescriptors[0] && this.faceDescriptors[1]) {
            this.compareFaces();
          }
        } else {
          console.error('No face detected in the image');
        }
      };
      reader.readAsDataURL(file);
    },
    drawLandmarks(img, detection, index) {
      const canvas = this.$refs[`canvas${index}`][0];
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw face landmarks with larger, more visible points
      const landmarks = detection.landmarks.positions;
      ctx.fillStyle = 'red';
      landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw lines connecting landmarks for more visibility
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 2;
      ctx.beginPath();
      landmarks.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    },
    compareFaces() {
      const distance = faceapi.euclideanDistance(this.faceDescriptors[0], this.faceDescriptors[1]);
      this.comparisonResult = {
        distance: distance,
        similarity: 1 - distance,
        isSamePerson: distance < 0.4, // This threshold can be adjusted
      };
    },
  },
};
</script>

<style scoped>
.image-uploads {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}
.image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.preview-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  border: 8px solid #333; /* Increased border size */
  margin-top: 10px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0,0,0,0.3); /* Added shadow for emphasis */
}
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.landmark-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.comparison-result {
  margin-top: 20px;
  text-align: left;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}
</style>