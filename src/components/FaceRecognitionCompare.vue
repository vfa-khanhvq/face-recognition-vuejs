<template>
  <div>
    <h1>Face Recognition</h1>
    <input type="file" @change="handleFileUpload(1)">
    <input type="file" @change="handleFileUpload(2)">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import * as faceapi from 'face-api.js';

export default {
  data() {
    return {
      modelsLoaded: false,
      faceDescriptors: [null, null],
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
        const img = new Image();
        img.onload = async () => {
          const canvas = this.$refs.canvas;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length > 0) {
            faceapi.draw.drawDetections(canvas, detections);
            faceapi.draw.drawFaceLandmarks(canvas, detections);

            this.faceDescriptors[index - 1] = detections[0].descriptor;

            if (this.faceDescriptors[0] && this.faceDescriptors[1]) {
              const distance = faceapi.euclideanDistance(this.faceDescriptors[0], this.faceDescriptors[1]);
              console.log('Face comparison distance:', distance);
              alert(`Face comparison distance: ${distance}`);
            }
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
  },
};
</script>
