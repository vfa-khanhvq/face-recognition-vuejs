<template>
  <div class="home">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/FaceRecognition.vue'

export default {
  name: 'FaceRecognitionView',
  components: {
    HelloWorld
  }
}
</script>
