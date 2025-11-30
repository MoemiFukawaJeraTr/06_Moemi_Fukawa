'use strict'
  const memberList = document.getElementById("memberList");
  const table = document.querySelector("table");
  const payer = document.querySelector('select');;
  const shopping = document.getElementById("shopping");
  const amount = document.getElementById("amount");

  const memberSubmit = document.getElementById('memberSubmit');
  memberSubmit.addEventListener("click", createOption, false);

  const shoppingSubmit = document.getElementById('shoppingSubmit');
  shoppingSubmit.addEventListener("click", addShoppingList, false);

  const submitCaluc = document.getElementById('submitCaluc');
  submitCaluc.addEventListener("click", calculate, false);

  let optionArray = []; //支払者のリスト
  const paymentMemberObj = {};//メンバーごとの支払いオブジェクト

  /* STEP1 */
  /**
   * プルダウンリストに入力したメンバーの名前を追加する
   */
  function createOption(){
    let memberText = memberList.value;
    optionArray = memberText.split(",");

    let selectMember = document.getElementById("payer");
    for(let num in optionArray){
      let tempOption = document.createElement("option");
      tempOption.text = optionArray[num];
      selectMember.appendChild(tempOption);
    }
  }

  /* STEP2 */
  /**
   * 動的にショッピングリストを作成
  */
  function addShoppingList(){
    const shoppingListObj = {}; 
    shoppingListObj.payer = payer.value;
    shoppingListObj.shopping = shopping.value;
    shoppingListObj.amount = amount.value;
    getPaymentMember(shoppingListObj);

    //入力をクリア
    payer.value ="";
    shopping.value ="";
    amount.value ="";

    //オブジェクトの要素を行に追加
    const row = document.createElement('tr');
    for(const key in shoppingListObj){
      const column = document.createElement('td');
      if(key === "amount"){
        column.textContent = Number(shoppingListObj[key]).toLocaleString() + "円";
      } else {
        column.textContent = shoppingListObj[key];
      }
      row.appendChild(column);
    }
    //テーブルに行を追加
    table.append(row);
  }

  /**
   * @param {object}  obj -人ごとに支払った金額を保持したオブジェクト
   * 人ごとの支払い総額を取得してオブジェクトに格納する
  */
  function getPaymentMember(obj){
    let memberName = obj.payer;
    let memberAmount = Number(obj.amount);
    if(!paymentMemberObj[memberName]){
      paymentMemberObj[memberName] = memberAmount;
    } else {
      paymentMemberObj[memberName] += memberAmount;
    }
  }

  /* STEP3 */
  /**
   * 清算処理の実行
  */
  function calculate(){
    getPaymentTotalList();
    const diffTotal = getdiffTotal();
    getPaymentMatching(diffTotal);
    //非表示要素を表示に切り替える
    let matchingResult = document.getElementById("matchingResult");
    matchingResult.style.display = "block";
  }

  /**
   * 人ごとの支払い総額を取得して画面に表示する
  */
  function getPaymentTotalList(){
    //要素をクリア
    document.getElementById("paymentTotalList").innerHTML = ""
    // UL要素を取得
    const listElement = document.getElementById("paymentTotalList");
    for(const key in paymentMemberObj){
      const li = document.createElement("li");
      li.textContent = key + "：" + Number(paymentMemberObj[key]).toLocaleString() + "円";
      listElement.appendChild(li);
    }
  }
  /**
   * 清算方法を画面に表示する
  */
  function getPaymentMatching(resultArry){
    //要素をクリア
    document.getElementById("paymentMatching").innerHTML = ""
    // ul要素を取得
    const listElement = document.getElementById("paymentMatching");
    for(const value of resultArry){
      const li = document.createElement("li");
      const fromName = value.from;
      const toName = value.to;
      const payment = Number(value.payment).toLocaleString();
      li.textContent = fromName + "は" + toName + "に" + payment +"円支払う";
      listElement.appendChild(li);
    }
  }


/**
 * @returns {Array<object>} 清算を最適化した結果（誰が誰に対しX円支払う）の配列
 */

function getdiffTotal(){
  let paymentTotal = 0; //全員の支払いの総額
  const paymentObj = paymentMemberObj //人ごとの支払い総額
  let personCount = 0;
  for(let name in paymentObj){
    paymentTotal += paymentObj[name];
    personCount += 1;
  }

  let avePayment = 0; //一人当たりの平均支払額
  const diffPaymentObj = {}; //人ごとの支払い差分
  avePayment = Math.round(paymentTotal / personCount);
  for(let k in paymentObj){
    diffPaymentObj[k] = paymentObj[k] - avePayment;
  }

  //支払金額が多い順と少ない順に並べ替える
  let creditorArray = []; //貸し手を貸し額が多い順にセットしたオブジェクトを持つ配列
  let debtorArray = []; //借り手を借り額が多い順にセットしたオブジェクトを持つ配列

  //キーを含んだ配列に変換
  const tempArray = Object.keys(diffPaymentObj).map((k)=>({ name: k, value: diffPaymentObj[k] }));

  //貸し者のみ(金額が＋のみ)の配列にする
  const notNegativeArray = tempArray.filter(item => item.value > 0);
  //降順（貸し金額が大きい順）にする
  creditorArray = 
  notNegativeArray.sort(function(a,b){
    if(a.value > b.value) return -1;
    if(a.value < b.value) return 1;
    return 0;
  });

  //借り者のみ(金額が-のみ)の配列にする
  const NegativeArray = tempArray.filter(item => item.value < 0);
  //昇順（仮金額が大きい順）にする
  debtorArray = 
  NegativeArray.sort(function(a,b){
    if(a.value < b.value) return -1;
    if(a.value > b.value) return 1;
    return 0;
  });

  //最大貸し者と借り者で清算を行う
  let x = 0;
  let y = 0;
  const settlementArry = []; //誰が誰に何円支払うかの配列
  
  while(x < creditorArray.length && y < debtorArray.length){
    let payment = Math.min(creditorArray[x].value,-(debtorArray[y].value))
    payment = Math.round(payment);
    //支払いのやり取りを記録
    settlementArry.push({
      from: debtorArray[y].name, //だれが
      to: creditorArray[x].name, //だれに
      payment: payment //いくら支払う
    });

    creditorArray[x].value -= payment;
    debtorArray[y].value += payment;

    //貸し者の金額が0円であれば次に回す
    if(creditorArray[x].value === 0){
      x += 1;
    }
    //借り者の金額が0円であれば次に回す
    if(debtorArray[y].value === 0){
      y += 1;
    }
  }
  return settlementArry;
}
