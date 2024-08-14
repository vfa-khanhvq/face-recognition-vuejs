<template>
  <div>
    <h1>Face Recognition</h1>
    <div class="container">
      <div class="video-container">
        <video ref="video" autoplay playsinline style="display: none;"></video>
        <canvas ref="videoCanvas"></canvas>
      </div>
      <div class="names-list" ref="namesList">
        <div v-for="(data, name) in emotionData" :key="name" class="name-emotion-chart">
          <div class="name-container" :style="{ color: data.color }">
            <img :src="data.croppedFace" alt="name" :style="{ borderColor: data.color }">
            <span>{{ name }}</span>
          </div>
        </div>
        <line-chart v-if="Object.keys(this.emotionData).length > 0" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title } from 'chart.js';
import { loadModels, startVideo, detectFaceFromVideo, loadDataset } from '../assets/js/faceRecognition';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title);

export default {
  components: {
    LineChart: Line
  },
  data() {
    return {
      faceDescriptors: {},
      displayNames: new Set(),
      emotionData: {},
      namesListReady: false,
      colors: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'], // Add more colors as needed
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.dataset.label}: ${tooltipItem.raw}%`;
              }
            }
          }
        }
      },
      chartData: {},
    };
  },
  async mounted() {
    try {
      console.log('Loading models...');
      const modelUrl = '/models'; // Adjust this path if needed
      await loadModels(modelUrl);
      console.log('Models loaded');
      this.namesListReady = true; // Set this flag when the component is mounted
      this.initializeFaceRecognition();
      await this.loadDataset();
    } catch (error) {
      console.error('Error initializing:', error);
    }
  },
  methods: {
    initializeFaceRecognition() {
      const videoElement = this.$refs.video;

      videoElement.addEventListener('loadedmetadata', () => {
        const canvas = this.$refs.videoCanvas;
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        detectFaceFromVideo(
          videoElement,
          canvas,
          this.faceDescriptors,
          this.displayNames,
          this.updateNamesList.bind(this)
        );
      });

      startVideo(videoElement, () => {
        console.log('Video started');
      }, (error) => {
        console.error('Error initializing video:', error);
      });
    },
    async loadDataset() {
      await loadDataset(this.faceDescriptors);
    },
    updateNamesList(bestMatch, croppedFace, emotions) {
      if (!this.namesListReady) {
        console.log('Names list not ready yet');
        return;
      }
      // let face = croppedFace;
      let distance = bestMatch.distance;
      const color = this.emotionData[bestMatch.name] ? this.emotionData[bestMatch.name].color : this.getRandomColor();
      if(this.emotionData[bestMatch.name]){
        if(distance < this.emotionData[bestMatch.name].distance){
          croppedFace = this.emotionData[bestMatch.name].croppedFace;
          distance = this.emotionData[bestMatch.name].distance;
        }
      }
      // Use direct assignment for Vue 3 reactivity
      this.emotionData[bestMatch.name] = { croppedFace, emotions, color, distance };
      this.updateChart();
    },
    updateChart() {
      if (Object.keys(this.emotionData).length < 1) {
        return;
      }
      let datasets = [];
      let labels = [];
      for (let item in this.emotionData) {
        const data = {
          label: item,
          data: Object.values(this.emotionData[item].emotions),
          borderColor: this.emotionData[item].color,
          backgroundColor: this.emotionData[item].color.replace('1)', '0.2)'),
          borderWidth: 2,
        };
        datasets.push(data);
        labels = Object.keys((this.emotionData[item].emotions))
      }
      this.chartData = {
        labels,
        datasets
      }
      console.log(this.chartData)
    },
    getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
  },
};
</script>

<style>
body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  padding: 20px 0;
  background-color: #333;
  color: white;
  margin: 0;
}

.container {
  display: flex;
  height: calc(100vh - 70px);
  /* Subtract the height of the h1 */
}

.video-container {
  position: relative;
}

video,
canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.names-list {
  background-color: rgb(144, 143, 142);
  padding: 10px;
  overflow-y: auto;
  color: white;
}

/* Styles for PC */
@media (min-width: 768px) {
  .video-container {
    width: 50%;
  }

  .names-list {
    width: 50%;
  }
}

/* Styles for mobile */
@media (max-width: 767px) {
  .container {
    flex-direction: column;
  }

  .video-container {
    width: 100%;
    height: 50vh;
  }

  .names-list {
    width: 100%;
    height: calc(50vh - 70px);
    /* Subtract the height of the h1 */
  }
}

/* Styles for the emotion table */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th,
td {
  border: 1px solid white;
  padding: 5px;
  text-align: center;
}

/* Style for the name and image container */
.name-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.name-container img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.name-container span {
  color: white;
  font-weight: bold;
}

.name-emotion-chart {
  margin-bottom: 20px;
}

.name-container img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
  border-radius: 50%;
  border: 2px solid;
  /* Border color will be set dynamically */
}

.name-container span {
  font-weight: bold;
}
</style>