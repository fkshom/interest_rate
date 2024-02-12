<script setup lang="ts">
import { ref, watch, computed, watchEffect, toRefs } from 'vue'
import type { Header, Item, SortType } from "vue3-easy-data-table";
import { 元金均等返済, 元利均等返済, type 繰り上げ返済, type 金利変動, } from '@/lib/interest_rate'
import { zip } from '@/lib/common'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler )
import draggable from 'vuedraggable'

import { useFormStore } from '@/stores/form';
const formStore = toRefs(useFormStore())
import { pinia } from '@/main'

const 借入額 = formStore.借入額
const 金利 = formStore.金利
const 借入期間 = formStore.借入期間
const 返済方法 = formStore.返済方法
const 繰り上げ返済items = formStore.繰り上げ返済items
const 金利変動items = formStore.金利変動items

const itemsPerPage = ref(500)
const headers = ref<Header[]>([
  { text: '#', value: "i" },
  { text: '返済額', value: '返済額' },
  { text: '返済元金', value: '返済元金' },
  { text: '返済利息', value: '返済利息' },
  { text: '残債', value: '残債' },
])

const items = ref<Item[]>()
const 返済元金と返済利息を積み重ねる = formStore.返済元金と返済利息を積み重ねる
const chartData = ref<ChartData<'line'>>({
    labels: [],
    datasets: []
  })

const chartOptions = ref<ChartOptions<'line'>>({})

const result = ref()
watchEffect(() => {
  const 返済期間_月 = 借入期間.value

  const 繰り上げ返済: 繰り上げ返済 = (() => {
    const result: 繰り上げ返済 = {}
    for(const tmp of 繰り上げ返済items.value){
      if(tmp.有効 === false){continue}
      if((tmp.回目) === ''){continue}
      if((tmp.金額) === ''){continue}
      result[ tmp.回目 ] = {
        金額: Number(tmp.金額) * 10_000,
        タイプ: tmp.タイプ,
      }
    }
    return result
  })()

  const 金利変動: 金利変動 = (() => {
    const result: 金利変動 = {}
    for(const tmp of 金利変動items.value){
      if(tmp.有効 === false){continue}
      if(tmp.回目 === ""){continue}
      if(tmp.金利 === ""){continue}
      result[ tmp.回目 ] = Number(tmp.金利) / 12 / 100
    }
    return result
  })()
  金利変動[0] = 金利.value / 12 / 100
  if(返済方法.value == "元利均等"){
    result.value = 元利均等返済(借入額.value * 10_000, 返済期間_月, 繰り上げ返済, 金利変動)
  } else {
    result.value =  元金均等返済(借入額.value * 10_000, 返済期間_月, 繰り上げ返済, 金利変動)
  }
})

function refreshItems(){
  const label = result.value.返済表[0]
  const values = result.value.返済表.slice(1)
  const tmp1: Item[] = []
  for(const value of values){
    const tmp2: Item = {}
    for(const kv of zip(label, value)){
      tmp2[kv[0].toString()] = kv[1].toString()
    }
    tmp1.push(tmp2)
  }
  items.value = tmp1
}

function refreshGraph(){
  const rows = result.value.返済表.slice(1)
  const xdata = []
  const y返済額: number[] = []
  const y返済元金 = []
  const y返済利息 = []
  const y残債 = []
  for(const row of rows){
    xdata.push(row[0].toString())
    y返済額.push(row[1].toString())
    y返済元金.push(row[2].toString())
    y返済利息.push(row[3].toString())
    y残債.push(row[4].toString())
  }

  if(返済元金と返済利息を積み重ねる.value === true){
    chartData.value = {
      labels: xdata,
      datasets: [
        { fill: 'origin', data: y残債, tension: 0.0, label: "残債", xAxisID: "xAxies", yAxisID: "yAxies1", backgroundColor: 'rgba(255, 0, 0, 0.1)' },
        // { fill: false, data: y返済額, tension: 0.0, label: "返済額", xAxisID: "xAxies", yAxisID: "yAxies3", backgroundColor: 'rgba(0, 255, 0, 0.1)'  },
        { fill: 'origin', data: y返済元金, tension: 0.0, label: "返済元金", xAxisID: "xAxies", yAxisID: "yAxies3",  backgroundColor: 'rgba(0, 255, 255, 0.1)'  },
        { fill: +1, data: y返済利息, tension: 0.0, label: "返済利息", xAxisID: "xAxies", yAxisID: "yAxies3", backgroundColor: 'rgba(255, 0, 255, 0.1)'  },
      ]
    }
    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxies: {
          type: 'linear',
          min: 1,
          max: 借入期間.value,
          ticks: {
            autoSkip: true,
            stepSize: 1,
          },
        },
        yAxies1: {
          type: 'linear',
          position: 'left',
          min: 0,
          suggestedMax: Math.max(Math.max(...y残債)),
        },
        // yAxies2: {
        //   type: 'linear',
        //   position: 'right',
        // },
        yAxies3: {
          type: 'linear',
          position: 'right',
          stacked: 返済元金と返済利息を積み重ねる.value,
          min: 0,
          suggestedMax: Math.max(Math.max(...y返済額)),
        },
      }
    }

  } else {
    chartData.value = {
      labels: xdata,
      datasets: [
        { fill: 'origin', data: y残債, tension: 0.0, label: "残債", xAxisID: "xAxies", yAxisID: "yAxies1", backgroundColor: 'rgba(255, 0, 0, 0.1)' },
        { fill: 'origin', data: y返済額, tension: 0.0, label: "返済額", xAxisID: "xAxies", yAxisID: "yAxies2", backgroundColor: 'rgba(0, 255, 0, 0.1)'  },
        { fill: 'origin', data: y返済利息, tension: 0.0, label: "返済利息", xAxisID: "xAxies", yAxisID: "yAxies2", backgroundColor: 'rgba(255, 0, 255, 0.1)'  },
        { fill: 'origin', data: y返済元金, tension: 0.0, label: "返済元金", xAxisID: "xAxies", yAxisID: "yAxies2",  backgroundColor: 'rgba(0, 255, 255, 0.1)'  },
      ]
    }
    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxies: {
          type: 'linear',
          min: 1,
          max: 借入期間.value,
          ticks: {
            autoSkip: true,
            stepSize: 1,
          },
        },
        yAxies1: {
          type: 'linear',
          position: 'left',
          min: 0,
          suggestedMax: Math.max(Math.max(...y残債)),
        },
        yAxies2: {
          type: 'linear',
          position: 'right',
          min: 0,
          suggestedMax: Math.max(Math.max(...y返済額)),
        },
        // yAxies3: {
        //   type: 'linear',
        //   position: 'right',
        //   stacked: stackGraph.value,
        //   min: 0,
        //   max: Math.max(Math.max(...y返済額)),
        // },
      }
    }
  }
}

watch(() => [result, 返済元金と返済利息を積み重ねる], () => {
  refreshItems()
  refreshGraph()
}, {
  immediate: true,
  deep: true,
})

const myStyles = {
    height: "400px",
    position: 'relative'
  }

function add繰り上げ返済(){
  繰り上げ返済items.value.push({
    回目: '',
    金額: '',
    タイプ: '期間短縮型',
    有効: true,
  })
}
function reset繰り上げ返済(){
  formStore.reset繰り上げ返済items.value()  // TODO
}
function delete繰り上げ返済(index: number){
  繰り上げ返済items.value.splice(index, 1)
}

function add金利変動(){
  金利変動items.value.push({
    回目: '',
    金利: '',
    有効: true,
  })
}
function reset金利変動(){
  formStore.reset金利変動items.value()  // TODO
}
function delete金利変動(index: number){
  金利変動items.value.splice(index, 1)
}
function aaa(){
  console.log("drag")
}
</script>

<template>
  <v-form>
    <v-container>
      <v-row>
        <v-col>
          <v-text-field label="借入額：" density="compact" v-model.number="借入額" type="number" suffix="万円"></v-text-field>
        </v-col>
        <v-col>
          <v-text-field label="金利（年利）：" density="compact" v-model.number="金利" type="number" suffix="%"></v-text-field>
        </v-col>
        <v-col>
          <v-text-field label="借入期間（月数）：" density="compact" v-model.number="借入期間" type="number" suffix="ヶ月"></v-text-field>
        </v-col>
        <v-col>
          <v-radio-group v-model="返済方法" inline density="compact">
            <template v-slot:label>
              返済方法
            </template>
            <v-radio label="元利均等" value="元利均等"></v-radio>
            <v-radio label="元金均等" value="元金均等"></v-radio>
          </v-radio-group>
        </v-col>
      </v-row>
      <v-row>
        繰り上げ返済
      </v-row>
      <draggable
        v-model="繰り上げ返済items"
        group="繰り上げ返済"
        handle=".handle"
        item-key="回目">
        <template #item="{element, index}">
        <v-row no-gutters style="height:100%; border: 1px solid #ccc; margin: 10px 10px; padding: 0px;" align="center" justify="center">
          <v-col cols="1">
            <v-icon icon="mdi-format-align-justify" size="x-large" class="handle"></v-icon>
          </v-col>
          <v-col cols="1" style="border: 0px solid #ccc"  justify="center">
            <v-switch color="primary" v-model="繰り上げ返済items[index].有効" density="compact" hide-details class="switch-center" @click.stop=""></v-switch>
          </v-col>
          <v-col class="item">
          <v-text-field label="借入期間（月数）" density="compact" v-model.number="繰り上げ返済items[index].回目" type="number" @click.self ="" :hide-details=true suffix="回目"></v-text-field>
          </v-col>
          <v-col cols="1">に</v-col>
          <v-col>
          <v-text-field label="金額" density="compact" v-model.number="繰り上げ返済items[index].金額" type="number" @click.stop="" :hide-details=true suffix="万円"></v-text-field>
          </v-col>
          <v-col cols="1">を</v-col>
          <v-col>
            <v-radio-group v-model="繰り上げ返済items[index].タイプ" inline density="compact" :hide-details=true @click.stop="">
              <v-radio label="期間短縮型" value="期間短縮型"></v-radio>
              <v-radio label="返済額軽減型" value="返済額軽減型"></v-radio>
            </v-radio-group>
          </v-col>
          <v-col cols="2">として返済</v-col>
          <v-col cols="1">
            <v-btn title="この繰り上げ返済を削除" variant="text" @click="delete繰り上げ返済(index)">
            <v-icon icon="mdi-delete-outline" size="x-large"></v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </template>
      </draggable>
      <v-row>
        <v-btn title="繰り上げ返済を追加" variant="text" @click="add繰り上げ返済">
          <v-icon icon="mdi-plus-box-outline" size="x-large"></v-icon>
          </v-btn>
          <v-btn title="初期化" variant="text" @click="reset繰り上げ返済">
              初期化
          </v-btn>
      </v-row>
      <v-row>
        金利変動
      </v-row>
      <draggable
        v-model="金利変動items"
        group="金利変動"
        handle=".handle"
        item-key="回目">
        <template #item="{element, index}">
        <v-row no-gutters style="height:100%; border: 1px solid #ccc; margin: 10px 10px; padding: 0px;" align="center">
          <v-col cols="1">
            <v-icon icon="mdi-format-align-justify" size="x-large" class="handle"></v-icon>
        </v-col>
        <v-col cols="1">
          <v-switch color="primary" v-model="金利変動items[index].有効" density="compact" hide-details class="switch-center"></v-switch>
        </v-col>
        <v-col>
        <v-text-field label="返済" density="compact" v-model.number="金利変動items[index].回目" type="number" :hide-details=true suffix="回目"></v-text-field>
        </v-col>
        <v-col cols="1">から</v-col>
        <v-col>
        <v-text-field label="金利（年利）" density="compact" v-model.number="金利変動items[index].金利" type="number" :hide-details=true suffix="%"></v-text-field>
        </v-col>
        <v-col cols="1">とする</v-col>
        <v-col cols="1">
          <v-btn title="この金利変動を削除" variant="text" @click="delete金利変動(index)">
          <v-icon icon="mdi-delete-outline" size="x-large"></v-icon>
          </v-btn>
        </v-col>
      </v-row>
      </template>
      </draggable>
      <v-row>
        <v-btn title="金利変動を追加" variant="text" @click="add金利変動">
          <v-icon icon="mdi-plus-box-outline" size="x-large"></v-icon>
          </v-btn>
          <v-btn title="初期化" variant="text" @click="reset金利変動">
          初期化
          </v-btn>
      </v-row>
    </v-container>
  </v-form>
  <v-container>
    <v-row>
      <v-col>
      <ul>
        <li>返済総額：{{ (result.返済元金累計 + result.返済利息累計).toLocaleString() }} 円</li>
        <li>支払利息総額：{{ result.返済利息累計.toLocaleString() }} 円</li>
        <li>借入期間：{{ result.返済表.length - 1 }} 回</li>
      </ul>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
    <v-switch color="primary" v-model="返済元金と返済利息を積み重ねる" density="compact" hide-details class="switch-center" label="返済元金と返済利息を積み重ねる"></v-switch>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
    <div class="graph_wrap">
      <div class="graph">
        <Line
          id="aaaaaaaa"
          :options="chartOptions"
          :data="chartData"
          :style="myStyles"
        />
      </div>
    </div>
  </v-col>
    </v-row>
    <v-row>
      <v-col>
   <EasyDataTable :headers="headers" :items="items" :prevent-context-menu-row="false" :rows-items=[1000] :rows-per-page=1000>
      </EasyDataTable>
    </v-col>
</v-row>
  </v-container>
</template>

<style scoped>
.graph_wrap {
  display: flex;
  justify-content: center;
  margin: 0 auto;
}
.graph {
  width: 100%;
  height: auto;
  /* width: 200px; widthを指定するとカッチリ指定できる*/
}

.switch-center {
  display: flex;
  justify-content: center;
}
</style>
