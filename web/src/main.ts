import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/base.css'
import './assets/main.scss'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { VueQueryPlugin } from "vue-query"
import ElementPlus from 'element-plus'
  
createApp(App)
	.use(router)
	.use(VueQueryPlugin)
	.use(ElementPlus)
	.mount('#app')
