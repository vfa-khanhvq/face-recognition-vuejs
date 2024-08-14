<template>
  <div>
    <input type="file" @change="onFileChange" />
    <img ref="inputImage" style="display: none;" />
    <div v-if="predictions.length">
      <h3>Predictions:</h3>
      <ul>
        <li v-for="(pred, index) in predictions" :key="index">
          {{ pred.className }}: {{ pred.probability }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { FaceEmotion } from '@/assets/js/emotion'; // Adjust the path to your emotion.js file

export default {
  name: 'FaceDetection',
  data() {
    return {
      faceEmotion: null,
      predictions: []
    };
  },
  async mounted() {
    try {
      this.faceEmotion = new FaceEmotion('model.json'); // Update the model URL
      await this.faceEmotion.loadModel();
    } catch (error) {
      console.error('Error loading FaceEmotion model:', error);
    }
  },
  methods: {
    async onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const img = new Image();
          img.onload = async () => {
            try {
              const predictions = await this.faceEmotion.classifyImage(img);
              this.predictions = await this.processPredictions(predictions);
            } catch (error) {
              console.error('Error detecting faces:', error);
            }
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    },
    async processPredictions(predictions) {
      // Process predictions to get readable format
      const topk = 3;
      const values = await predictions.data();
      const topkValues = Array.from(values)
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value)
        .slice(0, topk);

      return topkValues.map(({ value, index }) => ({
        className: `Class ${index}`, // Adjust to use actual class names
        probability: value
      }));
    }
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
