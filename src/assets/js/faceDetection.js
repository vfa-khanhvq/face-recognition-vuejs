// faceDetection.js
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

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
      await tf.setBackend('cpu');
      await tf.ready();
      console.log('Using CPU backend');
    }
  }

  async loadModel() {
    this.model = await blazeface.load();
    console.log('BlazeFace model loaded');
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

  cropFace(prediction, image) {
    const [startX, startY] = prediction.topLeft;
    const [endX, endY] = prediction.bottomRight;
    const size = [endX - startX, endY - startY];
  
    const scaleX = image.width / this.resizeWidth;
    const scaleY = image.height / this.resizeHeight;
  
    const x = startX * scaleX;
    const y = startY * scaleY;
    const width = size[0] * scaleX;
    const height = size[1] * scaleY;
  
    if (height >= this.faceHeightThreshold) {
      this.ctx.beginPath();
      this.ctx.rect(x, y, width, height);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'green';
      this.ctx.stroke();
  
      const faceCanvas = document.createElement('canvas');
      const faceCtx = faceCanvas.getContext('2d');
      faceCanvas.width = 112;
      faceCanvas.height = 112;
  
      faceCtx.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        112,
        112
      );
  
      this.croppedFaces.push(faceCanvas.toDataURL());
    }
  }
  
}
