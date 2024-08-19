<template>
    <div>
      <input type="file" @change="handleFileChange" />
      <div v-if="fileData">
        <h3>Selected File:</h3>
        <p><strong>Name:</strong> {{ fileName }}</p>
        <p><strong>Size:</strong> {{ fileSize }} bytes</p>
        <img v-if="isImage" :src="fileData" alt="Selected Image" width="200" />
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fileData: null, // Base64 encoded file data or other processing result
        fileName: '',
        fileSize: 0,
        isImage: false,
      };
    },
    methods: {
      handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
          this.fileName = file.name;
          this.fileSize = file.size;
  
          const reader = new FileReader();
          reader.onload = (e) => {
            // Base64 encoded file data
            this.fileData = e.target.result;
  
            // Check if the file is an image to display it
            this.isImage = file.type.startsWith('image/');
          };
          reader.readAsDataURL(file);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  img {
    display: block;
    margin-top: 10px;
  }
  </style>
  