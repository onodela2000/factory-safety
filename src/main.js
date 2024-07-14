import { createApp } from 'vue'
import App from './App.vue'
import { Button, RadioGroup, Radio, Cell, CellGroup, NavBar } from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(Button)
app.use(RadioGroup)
app.use(Radio)
app.use(Cell)
app.use(CellGroup)
app.use(NavBar)

app.mount('#app')