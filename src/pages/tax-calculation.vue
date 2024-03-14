<template>
  <div>
    <div class="w-[200px]">
      <el-input v-model="monthlyIncome">
        <template #append>
          <el-button :icon="Search" @click="calculate" /> </template
      ></el-input>
    </div>
    <el-table :data="tableData" border>
      <el-table-column prop="date" label="日期"></el-table-column>
      <el-table-column prop="shouru" label="收入"></el-table-column>
      <el-table-column prop="shuie" label="税收"></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue';
import BigNumber from 'bignumber.js';

import dayjs from 'dayjs';
const monthlyIncome = ref(14000); // 每月工资
const tableData = ref([]);
const calculate = () => {
  tableData.value = calculateMonthlyTax(monthlyIncome.value);
};

function add(num1, num2) {
  num1 = new BigNumber(num1);
  num2 = new BigNumber(num2);
  const sum = num1.plus(num2);

  return sum.toFixed(2);
}
// 任意数量的数减法函数 - 可变参数
function subtractNumbers(...numbers) {
  if (numbers.length === 0) {
    throw new Error('至少需要传入一个数值');
  }

  let result = new BigNumber(numbers[0]);
  for (let i = 1; i < numbers.length; i++) {
    const bigNum = new BigNumber(numbers[i]);
    result = result.minus(bigNum);
  }

  return result.toFixed(2);
}
// 乘法函数
function multiply(num1, num2) {
  const bigNum1 = new BigNumber(num1);
  const bigNum2 = new BigNumber(num2);
  const product = bigNum1.times(bigNum2);

  return product.toFixed(2);
}

function calculateMonthlyTax(income) {
  let accumulatedIncome = 0; // 累积收入

  let accumulatedSpecial = 0; // 累积专项 社保之类的
  let accumulatedTax = 0; // 累积应纳税
  const arr = [];
  for (let index = 0; index < 12; index++) {
    accumulatedIncome = add(accumulatedIncome, income);
    const accumulatedTaxFree = 5000 * index; // 累积免税

    // 如果是大于6
    if (index >= 6) {
      accumulatedSpecial = accumulatedSpecial + 1440; // 下半年
    } else {
      accumulatedSpecial = accumulatedSpecial + 1430.04; // 上半年
    }
    // 累积收入 - 累计免税 - 累计专项（社保） = 应纳税
    // 一次性奖金是单独扣税的 收3%
    // 计算应纳税
    const taxableIncome = subtractNumbers(
      accumulatedIncome,
      accumulatedTaxFree,
      accumulatedSpecial
    );

    console.log(taxableIncome);
    // https://zhuanlan.zhihu.com/p/643543589
    // https://www.zhihu.com/question/329215540 速算扣除数
    let tax = 0;

    // 速算扣除数
    let quickCalculationDeduction = 0;
    let rate = 0.03;

    if (taxableIncome > 144000) {
      quickCalculationDeduction = 16920;
      rate = 0.2;
    }
    if (taxableIncome > 36000) {
      quickCalculationDeduction = 2520;
      rate = 0.1;
    }

    tax = subtractNumbers(
      multiply(taxableIncome, rate),
      quickCalculationDeduction,
      accumulatedTax
    );
    console.log(
      taxableIncome,
      rate,
      multiply(taxableIncome, rate),
      quickCalculationDeduction,
      accumulatedTax
    );
    console.log(index + 1 + '月，税：', tax);
    accumulatedTax = add(accumulatedTax, tax);

    arr.push({
      accumulatedIncome,
      income,
      accumulatedTaxFree,
      accumulatedSpecial,
      tax, // 交税
      accumulatedTax,

      date:
        dayjs().format('YYYY') + '-' + (index + 1).toString().padStart(2, '0'),
      // shouru: '12499.67元',
      // shuie: '374.99元'
      shouru: income + '元',
      shuie: tax + '元'
    });
  }

  console.log(arr);
  return arr;
}
</script>

<style lang="scss" scoped></style>
