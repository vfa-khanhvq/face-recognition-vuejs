// faceDetection.js
import * as tf from '@tensorflow/tfjs-core';
import * as tfconv from '@tensorflow/tfjs-converter';

// faceEmotion.js
export class FaceEmotion {
    constructor(modelUrl) {
        this.modelUrl = modelUrl;
        this.model = null;
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

    async loadEmotionModel() {
        this.model = await tfconv.loadGraphModel(this.modelUrl);
        console.log('Emotion model loaded');
        await this.warmUpModel();
    }

    async warmUpModel() {
        if (!this.model) {
            throw new Error('Model is not loaded.');
        }

        const IMAGE_SIZE = 112;
        const dummyInput = tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]);
        const result = tf.tidy(() => this.model.predict(dummyInput));
        await result.data();
        result.dispose();
        console.log('Model warm-up complete');
    }

    preprocessImage(imgElement) {
        // this.displayOriginalImage(imgElement);

        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(imgElement);
            // console.log('Original Tensor Shape:', tensor.shape);

            const IMAGE_SIZE = 112;

            if (tensor.shape[0] !== IMAGE_SIZE || tensor.shape[1] !== IMAGE_SIZE) {
                tensor = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE], true);
            }

            // console.log('Resized Tensor Shape:', tensor.shape);

            tensor = tensor.toFloat().div(tf.scalar(255));
            // tensor.print();

            tensor = tensor.expandDims(0);
            // this.displayTensorImage(tensor.squeeze());

            return tensor;
        });
    }

    async predictEmotion(croppedFace) {
        if (!this.model) {
            console.error('Emotion model is not loaded');
            return;
        }
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
                // try {
                    const tensor = this.preprocessImage(img);
                    // console.log(this.model)
                    const prediction = await this.model.predict(tensor);
                    const data = await prediction.data();
                    tf.dispose([tensor, prediction]);

                    resolve(data);
                // } catch (error) {
                //     reject(error);
                // }
            };
            // img.onerror = (error) => reject(error);
            img.src = croppedFace;
        });
    }

    displayOriginalImage(imgElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        ctx.drawImage(imgElement, 0, 0);
        document.body.appendChild(canvas);
    }

    displayTensorImage(tensor) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = tensor.shape[1];
        canvas.height = tensor.shape[0];
        const imageData = new ImageData(
            new Uint8ClampedArray(tensor.flatten().arraySync()),
            tensor.shape[1],
            tensor.shape[0]
        );
        ctx.putImageData(imageData, 0, 0);
        document.body.appendChild(canvas);
    }
}
