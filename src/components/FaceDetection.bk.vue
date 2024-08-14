<template>
  <div class="face-detection">
    <video ref="webcam" autoplay muted></video>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import * as tf from '@tensorflow/tfjs-core';
import * as blazeface from '@tensorflow-models/blazeface';

export default {
  name: 'FaceDetection',
  data() {
    return {
      model: null,
      video: null,
      canvas: null,
      ctx: null,
    };
  },
  async mounted() {
    this.video = this.$refs.webcam;
    this.canvas = this.$refs.canvas;
    this.ctx = this.canvas.getContext('2d');

    await this.setupBackends();
    await this.setupWebcam();
    await this.loadModel();
    this.detectFaces();
  },
  methods: {
    async setupBackends() {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('Using WebGL backend');
      } catch (error) {
        console.warn('WebGL backend not supported. Falling back to CPU.');
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('Using CPU backend');
      }
    },
    async setupWebcam() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      this.video.srcObject = stream;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
      });
    },
    async loadModel() {
      this.model = await blazeface.load();
      console.log('BlazeFace model loaded');
    },
    async detectFaces() {
      const predictions = await this.model.estimateFaces(this.video, false);
      console.log('Predictions:', predictions);

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          this.drawFace(prediction);
        });
      }

      requestAnimationFrame(this.detectFaces);
    },
    drawFace(prediction) {
      const [startX, startY] = prediction.topLeft;
      const [endX, endY] = prediction.bottomRight;
      const size = [endX - startX, endY - startY];

      this.ctx.beginPath();
      this.ctx.rect(startX, startY, size[0], size[1]);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'green';
      this.ctx.stroke();
    },
  },
};
</script>

<style scoped>
.face-detection {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
