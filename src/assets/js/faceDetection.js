import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';  // Import WebGL backend
import '@tensorflow/tfjs-backend-cpu';    // Import CPU backend
import * as blazeface from '@tensorflow-models/blazeface';

export class FaceDetection {
  constructor(videoElement, canvasElement, resizeWidth = 640, resizeHeight = 480, faceHeightThreshold = 50) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.resizeWidth = resizeWidth;
    this.resizeHeight = resizeHeight;
    this.faceHeightThreshold = faceHeightThreshold;
    this.model = null;
    this.croppedFaces = [];
  }

  async setupBackends() {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('Using WebGL backend');
    } catch (error) {
      console.warn('WebGL backend not supported. Falling back to CPU.');
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('Using CPU backend');
      } catch (cpuError) {
        console.error('Failed to set CPU backend:', cpuError);
      }
    }
    const backends = tf.getBackend();
    console.log('Current backend:', backends);
  }

  async loadModel() {
    try {
      this.model = await blazeface.load();
      console.log('BlazeFace model loaded');
    } catch (error) {
      console.error('Error loading BlazeFace model:', error);
    }
  }

  async setupWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.video.srcObject = stream;

    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        this.canvas.width = this.resizeWidth;
        this.canvas.height = this.resizeHeight;
        resolve();
      };
    });
  }

  async detectFaces() {
    const resizedImage = await this.resizeImage(this.video);
    const predictions = await this.model.estimateFaces(resizedImage, false);
    // console.log('Predictions:', predictions);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(resizedImage, 0, 0);
    this.croppedFaces = [];

    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        this.cropFace(prediction, resizedImage);
      });
    }

    requestAnimationFrame(() => this.detectFaces());
  }
  async resizeImage(video) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = this.resizeWidth;
    tempCanvas.height = this.resizeHeight;

    tempCtx.drawImage(video, 0, 0, this.resizeWidth, this.resizeHeight);

    return new Promise((resolve) => {
      const resizedImage = new Image();
      resizedImage.src = tempCanvas.toDataURL();
      resizedImage.onload = () => resolve(resizedImage);
    });
  }
  
  cropFace(prediction) {
    const [startX, startY] = prediction.topLeft;
    const [endX, endY] = prediction.bottomRight;
    const size = [endX - startX, endY - startY];

    if (size[1] >= this.faceHeightThreshold) {
      this.ctx.beginPath();
      this.ctx.rect(startX, startY, size[0], size[1]);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'green';
      this.ctx.stroke();

      const faceCanvas = document.createElement('canvas');
      const faceCtx = faceCanvas.getContext('2d');
      faceCanvas.width = size[0];
      faceCanvas.height = size[1];

      faceCtx.drawImage(
        this.video,
        startX,
        startY,
        size[0],
        size[1],
        0,
        0,
        size[0],
        size[1]
      );

      this.croppedFaces.push(faceCanvas.toDataURL());
    }
  }
}
