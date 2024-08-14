import { createRouter, createWebHistory } from 'vue-router'
import FaceRecognitionView from '../views/FaceRecognitionView.vue'

const routes = [
  {
    path: '/',
    name: 'recognition',
    component: FaceRecognitionView
  },
  {
    path: '/detect',
    name: 'detect',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/FaceDetectionView.vue')
  },
  {
    path: '/compare',
    name: 'compare',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/FaceRecognitionCompareView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
