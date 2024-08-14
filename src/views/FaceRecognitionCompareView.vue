<template>
  <div class="home">
    <FaceRecognitionCompare />
  </div>
</template>

<script>
// @ is an alias to /src
import FaceRecognitionCompare from '@/components/FaceRecognitionCompare.vue'

export default {
  name: 'FaceRecognitionCompareView',
  components: {
    FaceRecognitionCompare
  }
}
</script>
