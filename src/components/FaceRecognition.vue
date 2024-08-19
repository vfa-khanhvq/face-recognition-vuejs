<template>
  <div>
    <h1>Face Recognition</h1>
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading models and setting up face data...</p>
    </div>
    <div v-else class="container">
      <div class="video-container">
        <video ref="video" autoplay playsinline style="display: none;"></video>
        <canvas ref="videoCanvas"></canvas>
      </div>
      <div class="names-list" ref="namesList">
        <div class="name-emotion-chart">
          <div v-for="(data, name) in emotionData" :key="name" class="name-container" :style="{ color: data.color }">
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
      loading: true, // Add a loading state
      faceDescriptors: {},
      displayNames: new Set(),
      emotionData: {},
      namesListReady: false,
      colors: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'], // Add more colors as needed
      chartOptions: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 100,
          },
        },
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
      displayChart: false,
    };
  },
  async mounted() {
    try {
      console.log('Loading models...');
      const modelUrl = '/models'; // Adjust this path if needed
      await loadModels(modelUrl);
      console.log('Models loaded');
      await this.loadDataset();
      this.namesListReady = true; // Set this flag when the component is mounted
      this.loading = false; // Set loading to false when everything is ready
      this.initializeFaceRecognition();
      this.displayChart = true;
    } catch (error) {
      console.error('Error initializing:', error);
      this.loading = false; // Hide loading screen even if there is an error
    }
  },
  methods: {
    initializeFaceRecognition() {
      this.$nextTick(() => {
        const videoElement = this.$refs.video;

        if (!videoElement) {
          console.log('Video element not found');
          return;
        }

        startVideo(videoElement, () => {
          console.log('Video started');
        }, (error) => {
          alert('Error initializing video:', error);
        });

        // setTimeout(() => {
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
        // }, 0);
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
      if (this.emotionData[bestMatch.name]) {
        if (distance < this.emotionData[bestMatch.name].distance) {
          croppedFace = this.emotionData[bestMatch.name].croppedFace;
          distance = this.emotionData[bestMatch.name].distance;
        }
      }
      // Use direct assignment for Vue 3 reactivity
      this.emotionData[bestMatch.name] = { croppedFace, emotions, color, distance };
      if (this.displayChart)
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

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 70px);
}

.loading-spinner {
  border: 16px solid #f3f3f3;
  /* Light grey */
  border-top: 16px solid #3498db;
  /* Blue */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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
    margin-bottom: 10px;
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
