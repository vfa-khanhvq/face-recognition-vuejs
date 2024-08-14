<template>
  <div>
    <input type="file" @change="handleImageUpload" accept="image/*" />
    <img id="inputImage" ref="inputImage" alt="Input Image" style="display: none;" />
    <canvas id="outputCanvas" ref="outputCanvas"></canvas>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default {
  data() {
    return {
      model: null,
    };
  },
  async mounted() {
    try {
      // Load the BlazeFace model
      this.model = await blazeface.load();
      console.log('BlazeFace model loaded');
    } catch (error) {
      console.error('Error loading BlazeFace model:', error);
    }
  },
  methods: {
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        this.$refs.inputImage.src = imageUrl;
        this.$refs.inputImage.onload = async () => {
          await this.detectFaces();
        };
      }
    },

    async detectFaces() {
      if (!this.model) {
        console.error('BlazeFace model is not loaded.');
        return;
      }

      const inputImage = this.$refs.inputImage;
      const outputCanvas = this.$refs.outputCanvas;

      // Set canvas size to match input image
      outputCanvas.width = inputImage.width;
      outputCanvas.height = inputImage.height;
      const ctx = outputCanvas.getContext('2d');
      ctx.drawImage(inputImage, 0, 0, inputImage.width, inputImage.height);

      try {
        // Perform face detection
        const predictions = await this.model.estimateFaces(inputImage);

        // Draw bounding boxes around detected faces
        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height); // Clear previous drawings
        for (const prediction of predictions) {
          const [x, y, width, height] = [
            prediction.topLeft[0],
            prediction.topLeft[1],
            prediction.bottomRight[0] - prediction.topLeft[0],
            prediction.bottomRight[1] - prediction.topLeft[1],
          ];

          // Draw bounding box
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Draw label (if needed)
          ctx.fillStyle = 'red';
          ctx.font = '16px Arial';
          ctx.fillText('Face', x, y - 10);
        }
      } catch (error) {
        console.error('Error detecting faces:', error);
      }
    },
  },
};
</script>

<style scoped>
/* Add any additional styles if necessary */
</style>
