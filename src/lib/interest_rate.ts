
function pmt(r: number, nper: number, pv: number, fv: number) {
  // r:利率 nper:期間 pv:現在価値 fv:将来価値
   return r / (Math.pow(1 + r, nper) - 1) * -(pv * Math.pow(1 + r, nper) + fv);
}

function NPER(rate: number, pmt: number, pv: number, fv: number|undefined = undefined, end_or_beginning: 0|1|undefined = undefined){
  if(fv === undefined){
    fv = 0
  }
  if(end_or_beginning === undefined){
    end_or_beginning = 0
  }
  if(rate === 0){
    return (-pv - fv) / pmt
  }

  const z = pmt * (1 + rate * end_or_beginning) / rate
  const temp = Math.log((-fv + z) / (pv + z))

  return temp / Math.log(1 + rate)
}

type Result = {
  返済元金累計: number,
  返済利息累計: number,
  返済表: (number|string)[][],
}

interface 繰り上げ返済 {
  [index: number]: {
    金額: number,
    タイプ: '期間短縮型' | '返済額軽減型'
  }
}



interface 金利変動 {
  [index: number]: number
}


function 元利均等返済(借入額:number, 返済期間_月:number, 繰り上げ返済: 繰り上げ返済, 金利変動: 金利変動): Result{
  const result: Result = {
    返済元金累計: 0,
    返済利息累計: 0,
    返済表: [],
  }

  let 返済元金累計 = 0
  let 返済利息累計 = 0
  let 残債 = 借入額
  let 金利_月 = 金利変動[0]

  let 毎月返済額 = -1 * pmt(金利_月, 返済期間_月, 残債, 0)
  毎月返済額 = Math.floor(毎月返済額)

  result.返済表.push("i 返済額 返済元金 返済利息 残債".split(" "))
  let 返済期間_月_current = 返済期間_月

  for(let i = 0; i < 返済期間_月; i++){
    if(金利変動[i] !== undefined){
      金利_月 = 金利変動[i]
      毎月返済額 = -1 * pmt(金利_月, 返済期間_月_current - i, 残債, 0)
      毎月返済額 = Math.floor(毎月返済額)
    }
    const 返済利息 = Math.floor(残債 * 金利_月)
    // console.log(i, 残債, 毎月返済額, 返済利息)

    let 返済元金
    if(残債 < 毎月返済額){
      返済元金 = 残債
    } else if(返済期間_月_current -1 == i){
      返済元金 = 残債
    } else {
      返済元金 = 毎月返済額 - 返済利息
    }

    if(繰り上げ返済[i+1] !== undefined){
      返済元金 += 繰り上げ返済[i+1]['金額']
    }

    const 返済額 = 返済元金 + 返済利息
    残債 -= 返済元金
    返済元金累計 += 返済元金
    返済利息累計 += 返済利息
    
    result.返済表.push(`${i+1} ${返済額} ${返済元金} ${返済利息} ${残債}`.split(" "))

    if(繰り上げ返済[i+1] !== undefined){
      if(繰り上げ返済[i+1]['タイプ'] == "期間短縮型"){
        返済期間_月_current = Math.ceil(NPER(金利_月, -1 * 毎月返済額, 残債, undefined, undefined)) + i + 1
      } else if(繰り上げ返済[i+1]['タイプ'] == "返済額軽減型"){
        毎月返済額 = -1 * pmt(金利_月, 返済期間_月_current - (i+1), 残債, 0)
        毎月返済額 = Math.floor(毎月返済額)
      }
    }

    if(残債 <= 0){
      break
    }
  }
  result.返済元金累計 = 返済元金累計
  result.返済利息累計 = 返済利息累計
  return result
}


function 元金均等返済(借入額:number, 返済期間_月:number, 繰り上げ返済: 繰り上げ返済, 金利変動: 金利変動): Result{
  const result: Result = {
    返済元金累計: 0,
    返済利息累計: 0,
    返済表: [],
  }

  let 返済元金累計 = 0
  let 返済利息累計 = 0
  let 残債 = 借入額
  let 金利_月 = 金利変動[0]

  let 毎月返済元金 = Math.floor(借入額 / 返済期間_月)

  result.返済表.push("i 返済額 返済元金 返済利息 残債".split(" "))
  let 返済期間_月_current = 返済期間_月

  for(let i = 0; i < 返済期間_月; i++){
    if(金利変動[i] !== undefined){
      金利_月 = 金利変動[i]
      毎月返済元金 = Math.floor(残債 / (返済期間_月_current - i))
    }
    const 返済利息 = Math.floor(残債 * 金利_月)
    // console.log(i, 残債, 毎月返済元金, 返済利息)

    let 返済元金
    if(残債 < 毎月返済元金){
      返済元金 = 残債
    } else if(返済期間_月_current -1 == i){
      返済元金 = 残債
    } else {
      返済元金 = 毎月返済元金
    }

    if(繰り上げ返済[i+1] !== undefined){
      返済元金 += 繰り上げ返済[i+1]['金額']
    }

    const 返済額 = 返済元金 + 返済利息
    残債 -= 返済元金
    返済元金累計 += 返済元金
    返済利息累計 += 返済利息
    
    result.返済表.push(`${i+1} ${返済額} ${返済元金} ${返済利息} ${残債}`.split(" "))

    if(繰り上げ返済[i+1] !== undefined){
      if(繰り上げ返済[i+1]['タイプ'] == "期間短縮型"){
        返済期間_月_current -= Math.floor(繰り上げ返済[i+1]['金額'] / 毎月返済元金)
      } else if(繰り上げ返済[i+1]['タイプ'] == "返済額軽減型"){
        毎月返済元金 = Math.floor(残債 / (返済期間_月_current - (i+1)))
      }
    }

    if(残債 <= 0){
      break
    }
  }
  result.返済元金累計 = 返済元金累計
  result.返済利息累計 = 返済利息累計
  return result
}


export { 元利均等返済, 元金均等返済, NPER }
export type { 繰り上げ返済, 金利変動 }
