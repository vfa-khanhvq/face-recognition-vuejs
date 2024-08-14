import * as tf from '@tensorflow/tfjs-core';

// Load emotion detection model
export async function loadEmotionModel(modelUrl) {
  const model = await tf.loadLayersModel(modelUrl);
  console.log('Emotion model loaded');
  return model;
}
