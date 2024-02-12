import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useFormStore = defineStore('form', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  interface 繰り上げ返済item {
    回目: number|'',
    金額: number|'',
    タイプ: '期間短縮型' | '返済額軽減型',
    有効: boolean,
  }
  
  interface 金利変動item {
    回目: number|'',
    金利: number|'',
    有効: boolean,
  }

  const 借入額 = ref<number>(100)
  const 金利 = ref<number>(2.0)
  const 借入期間 = ref<number>(120)
  const 返済方法 = ref<'元利均等'|'元金均等'>("元利均等")
  const 繰り上げ返済items_default: 繰り上げ返済item[] = [
    {
      回目: 2,
      金額: 3,
      タイプ: '期間短縮型',
      有効: true,
    },
    {
      回目: 3,
      金額: 3,
      タイプ: '期間短縮型',
      有効: true,
    },
    {
      回目: 40,
      金額: 3,
      タイプ: '返済額軽減型',
      有効: false,
    }
  ]
  const 繰り上げ返済items = ref<繰り上げ返済item[]>([])
  繰り上げ返済items.value = structuredClone(繰り上げ返済items_default)
  const 金利変動items_default: 金利変動item[] = [
    {
      回目: 60,
      金利: 20.0,
      有効: true,
    }
  ]
  const 金利変動items = ref<金利変動item[]>([])
  金利変動items.value = structuredClone(金利変動items_default)

  const reset繰り上げ返済items = () => {
    繰り上げ返済items.value = structuredClone(繰り上げ返済items_default)
  }
  const reset金利変動items = () => {
    金利変動items.value = structuredClone(金利変動items_default)
  }

  const 返済元金と返済利息を積み重ねる = ref(true)

  return { 借入額, 金利, 借入期間, 返済方法, 繰り上げ返済items, 金利変動items, reset繰り上げ返済items, reset金利変動items, 返済元金と返済利息を積み重ねる }
},
{
  persist: true,
})
