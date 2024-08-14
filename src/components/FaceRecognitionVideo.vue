<template>
  <div>
    <h1>Face Recognition</h1>
    <div class="container">
      <input type="file" @change="handleVideoUpload" accept="video/*" />
      <video ref="video" autoplay playsinline></video>
      <canvas ref="videoCanvas"></canvas>
      <div class="names-list" ref="namesList"></div>
    </div>
  </div>
</template>

<script>
import { loadModels, detectFaceFromVideo, loadDataset } from '../assets/js/faceRecognition';
import { loadEmotionModel } from '../assets/js/tf'
export default {
  data() {
    return {
      faceDescriptors: {}, // Store face descriptors for comparison
      displayNames: new Set(),
    };
  },
  async mounted() {
    try {
      console.log('Loading models...');
    const modelUrl = '/models'; // Adjust this path if needed
    await loadModels(modelUrl);
    console.log('Models loaded');

    const emotionModelUrl = '/model.json'; // Adjust this path
    const emotionModel = await loadEmotionModel(emotionModelUrl);

    this.initializeFaceRecognition(emotionModel);
    await this.loadDataset(); // Load dataset descriptors
    } catch (error) {
      console.error('Error initializing:', error);
    }
  },
  methods: {
    async handleVideoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const videoURL = URL.createObjectURL(file);
        this.$refs.video.src = videoURL;
        this.$refs.video.load();
        this.$refs.video.onloadeddata = () => {
          this.initializeFaceRecognition();
        };
      }
    },
    initializeFaceRecognition() {
      detectFaceFromVideo(
        this.$refs.video,
        this.$refs.videoCanvas,
        this.faceDescriptors,
        this.displayNames,
        this.updateNamesList.bind(this)
      );
    },
    async loadDataset() {
      await loadDataset(this.faceDescriptors);
    },
    updateNamesList(name, croppedFace) {
      if (!this.displayNames.has(name)) {
        this.displayNames.add(name);
        const namesList = this.$refs.namesList;
        const nameElement = document.createElement('div');
        nameElement.style.display = 'flex';
        nameElement.style.alignItems = 'center';
        nameElement.style.marginBottom = '10px';

        const imgElement = document.createElement('img');
        imgElement.src = croppedFace;
        imgElement.style.width = '50px';
        imgElement.style.height = '50px';
        imgElement.style.marginRight = '10px';
        imgElement.style.borderRadius = '50%';
        imgElement.style.border = '2px solid white';

        const textElement = document.createElement('span');
        textElement.textContent = `${this.displayNames.size}. ${name}`;
        textElement.style.color = 'white';

        nameElement.appendChild(imgElement);
        nameElement.appendChild(textElement);
        namesList.appendChild(nameElement);
      }
    }
  },
};
</script>


<style>
h1 {
  text-align: center;
}

.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

video,
canvas {
  max-width: 100%;
  height: auto;
  background-color: rgb(144, 143, 142);
  align-self: baseline;
}

.names-list {
  background-color: rgb(144, 143, 142);
  min-height: 10px;
  margin-left: 20px;
  padding: 10px;
  overflow-y: auto;
  color: white;
  align-self: start;
}

.names-list div {
  color: white;
  border-radius: 3px;
  margin: 5px 0;
}

/* Styles for PC */
@media(min-width: 768px) {
  .container {
    flex-direction: row;
  }

  video,
  canvas {
    height: 80vh;
  }

  .names-list {
    margin-left: 20px;
    max-width: 20%;
  }
}

/* Styles for mobile */
@media(max-width: 767px) {
  .container {
    flex-direction: column;
  }

  video,
  canvas {
    width: 100%;
  }

  .names-list {
    margin-left: 0;
    margin-top: 10px;
    width: 100%;
  }
}
</style>
