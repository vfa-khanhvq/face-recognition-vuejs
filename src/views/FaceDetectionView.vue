<template>
  <div>
    <video ref="video" width="640" height="480" autoplay></video>
    <canvas ref="canvas" width="640" height="480"></canvas>
    <button @click="startDetection" :disabled="!modelLoaded">Start Face Detection</button>
  </div>
</template>

<script>
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

export default {
  name: 'FaceDetection',
  data() {
    return {
      model: null,
      isDetecting: false,
      modelLoaded: false,
    };
  },
  async mounted() {
    await tf.setBackend('webgl');
    await tf.ready();
    await this.setupModel();
    await this.setupCamera();
  },
  methods: {
    async setupModel() {
      await tf.ready();
      this.model = await blazeface.load();
      this.modelLoaded = true;
    },
    async setupCamera() {
      const video = this.$refs.video;
      if (navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
        } catch (error) {
          console.error("Error accessing the webcam:", error);
        }
      }
    },
    async startDetection() {
      if (this.isDetecting || !this.modelLoaded) return;
      this.isDetecting = true;

      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');

      const detectFaces = async () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const predictions = await this.model.estimateFaces(video, false);

          predictions.forEach(prediction => {
            const start = prediction.topLeft;
            const end = prediction.bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];

            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(start[0], start[1], size[0], size[1]);
          });

          if (this.isDetecting) {
            requestAnimationFrame(detectFaces);
          }
        } catch (error) {
          console.error("Error during face detection:", error);
          this.isDetecting = false;
        }
      };

      detectFaces();
    },
  },
};
</script>