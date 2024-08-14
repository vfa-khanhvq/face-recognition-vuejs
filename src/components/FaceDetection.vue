<template>
  <div class="face-detection">
      <div class="cropped-faces" v-if="croppedFaces.length">
      <h3>Cropped Faces</h3>
      <img v-for="(face, index) in croppedFaces" :key="index" :src="face" />
    </div>
      <video ref="webcam" autoplay muted></video>
    <canvas ref="canvas" class="canvas-overlay"></canvas>
    
  </div>
</template>

<script>
import { FaceDetection } from '../assets/js/faceDetection';

export default {
  name: 'FaceDetectionComponent',
  data() {
    return {
      faceDetection: null,
      croppedFaces: [],
    };
  },
  async mounted() {
    this.faceDetection = new FaceDetection(
      this.$refs.webcam,
      this.$refs.canvas
    );

    await this.faceDetection.setupBackends();
    await this.faceDetection.loadModel();
    await this.faceDetection.setupWebcam();

    this.faceDetection.detectFaces();
    this.$watch(
      () => this.faceDetection.croppedFaces,
      (newFaces) => {
        this.croppedFaces = newFaces;
      }
    );
  },
};
</script>

<style scoped>
.face-detection {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

video {
  width: 100%;
  height: auto;
}

.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.cropped-faces {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  z-index: 1;
}

.cropped-faces img {
  max-width: 100px;
  border: 1px solid #ccc;
}
</style>