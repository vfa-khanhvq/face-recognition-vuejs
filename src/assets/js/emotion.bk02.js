// emotion.js
import * as tf from '@tensorflow/tfjs';

export class FaceEmotion {
  constructor(modelUrl) {
    this.modelUrl = modelUrl;
    this.model = null;
  }

  async loadModel() {
    this.model = await tf.loadGraphModel(this.modelUrl);
  }

  async classifyImage(image) {
    if (!this.model) {
      throw new Error('Model is not loaded');
    }

    const tensor = tf.browser.fromPixels(image).toFloat();
    const resized = tf.image.resizeBilinear(tensor, [112, 112]);
    const batched = resized.expandDims(0);
    const predictions = this.model.predict(batched);

    return predictions;
  }
}
