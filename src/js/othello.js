'use strict';
// // 標準的なpolyfillをインストール
import 'core-js/stable';
// // 必要なpolyfillをインストール

// // fontawesomeインストール
// import {config, dom, library} from '@fortawesome/fontawesome-svg-core';
// import {

// } from '@fortawesome/free-solid-svg-icons';
// import {

// } from '@fortawesome/free-regular-svg-icons-svg-icons';
// import {

// } from '@fortawesome/free-brands-svg-icons';
// // アイコンが見つからない場合の挙動 ?マークがアニメーション
// config.showMissingIcons = true;
// // 上記3行で記載したアイコンをライブラリに追加
// library.add(

// );
// // <i>タグを<svg>タグに変換
// dom.watch();

// 要素取得
// ターン表示
const current_turn = document.querySelector('.current-turn');
// 盤面
const field = document.querySelector('.field');
const masu_wraps = document.querySelectorAll('.masu-wrap');
// 解答
const answer_input = document.querySelector('.answer-input');
const answer_btn = document.querySelector('.answer-btn');
// ヒント
let hint;
const hint_btn = document.querySelector('.hint-btn');
const hint_content = document.querySelector('.hint-content');
// 取得枚数表示エリア
const red_current_count = document.querySelector('.red-current-count');
const blue_current_count = document.querySelector('.blue-current-count');

// ターン定義 −１の場合、赤 １の場合、青
let turn = -1;
const stone_color = {
  '-1': 'red-stone',
  '1': 'blue-stone'
};
const turn_color = {
  '-1': 'red-turn',
  '1': 'blue-turn'
};

// 獲得枚数
let red_stone;
let blue_stone;
let red_penalty = 0;
let blue_penalty = 0;

// 判定用配列
let error = [];
let fin = [];
let end = [];
let reversible_stones = [];
let tops = [];
let reversible_tops = [];
let bottoms = [];
let reversible_bottoms = [];
let rights = [];
let reversible_rights = [];
let lefts = [];
let reversible_lefts = [];
let right_tops = [];
let reversible_right_tops = [];
let right_bottoms = [];
let reversible_right_bottoms = [];
let left_tops = [];
let reversible_left_tops = [];
let left_bottoms = [];
let reversible_left_bottoms = [];

// カタカナで入力された場合ひらがなに変換
answer_input.addEventListener('blur', function() {
  let answer_value = answer_input.value.replace(/[ァ-ン]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0x60);
  });
 answer_input.value = answer_value;
});

// ゲーム処理
for(let y = 0; y < 6; y ++) {
  for(let x = 0; x < 6; x ++) {
    // 選択されたマスを変数 selected_masu で定義
    let selected_masu = field.rows[y].cells[x];
    // selected にクリックイベント付与
    selected_masu.addEventListener('click', function() {
      // 初期化
      init();
      answer_btn.disabled = false;
      reversible_stones = [];
      // ヒントをグローバル変数で定義
      hint = selected_masu.dataset.hint;
      // 選択されたマスを可視化
      selected_masu.firstElementChild.style.fontWeight = 'bold';
      // label と input を紐付ける
      selected_masu.firstElementChild.setAttribute('for', 'selected');
      // ヒント
      hint_btn.addEventListener('click', open_close);
      hint_btn.addEventListener('click', open_hint);
      // 選択したマスに置けるか
      selected_stone_check(selected_masu);
      // 反せる石があるか確認
      reverse_stone_check(y, x);
      // 置けない場合、アラートと入力不可
      if(error.length !== 0) {
        answer_btn.disabled = true;
        init();
        hint_btn.removeEventListener('click', open_hint);
        hint_btn.removeEventListener('click', open_close);
        alert('そこには置けません');
      }
      // 正誤判定
      answer_check(selected_masu);
    });
  }
}

// 反せる石があるか確認
function reversible_check(angle, reversible_angle) {
  for(let i = 0; i < angle.length; i ++) {
    // 枠の１つ内側問題
    if(angle.length === 2) {
      continue;
    // ターン交代後の確認で敵の色を取得するのを防ぐ
    } else if(angle[0].firstElementChild.classList.contains(stone_color[turn * -1])) {
      continue;
    } else {
      // 敵の色
      if(angle[i].firstElementChild.classList.contains(stone_color[turn * -1])) {
        // 配列に追加
        reversible_angle.push(angle[i]);
      // 自分の色
      } else if(angle[i].firstElementChild.classList.contains(stone_color[turn])) {
        // １度配列に追加し、処理をストップ
        reversible_angle.push(angle[i]);
        break;
      // 白の場合
      } else {
        // 選択されたマスを除くマスで白が取得された場合
        if(i >= 1) {
          reversible_angle = [];
          break;
        } 
      }
    }
  }
  // 配列の末尾に敵の色があるか確認
  if(reversible_angle.length !== 0) {
    if(reversible_angle.slice(-1)[0].firstElementChild.classList.contains(stone_color[turn]) === false) {
      reversible_angle = [];
    } else {
      reversible_angle.pop();
    }
  }
  // 置けるマスにopacityを付ける
  if(reversible_angle.length !== 0) {
    angle[0].firstElementChild.style.opacity = 1.0;
  }
  // 反せる石を配列で取得
  reversible_angle.forEach(function(stone) {
    reversible_stones.push(stone);
  })
}

// 選択されたマスが白か確認
function selected_stone_check(selected) {
  if(selected.firstElementChild.classList.contains('white-stone') === false) {
    error.push('error1');
  }
}

// 選択されたマスに隣接する８方向に反せる石があるか確認
function reverse_stone_check(y, x) {
  // 上方向
  for(let h = y; h >= 0; h --) {
    tops.push(field.rows[h].cells[x]);
  }
  reversible_check(tops, reversible_tops);
  // 下方向
  for(let h = y; h <= 5; h ++) {
    bottoms.push(field.rows[h].cells[x]);
  }
  reversible_check(bottoms, reversible_bottoms);
  // 右方向
  for(let w = x; w <= 5; w ++) {
    rights.push(field.rows[y].cells[w]);
  }
  reversible_check(rights, reversible_rights);
  // 左方向
  for(let w = x; w >= 0; w --) {
    lefts.push(field.rows[y].cells[w]);
  }
  reversible_check(lefts, reversible_lefts);
  // 右上方向
  {
    let h = y;
    let w = x;
    while(h >= 0 && w <= 5) {
      right_tops.push(field.rows[h].cells[w]);
      h --;
      w ++;
    }
  }
  reversible_check(right_tops, reversible_right_tops);
  // 右下方向
  {
    let h = y;
    let w = x;
    while(h <= 5 && w <= 5) {
      right_bottoms.push(field.rows[h].cells[w]);
      h ++;
      w ++;
    }
  }
  reversible_check(right_bottoms, reversible_right_bottoms);
  // 左上方向
  {
    let h = y;
    let w = x;
    while(h >= 0 && w >= 0) {
      left_tops.push(field.rows[h].cells[w]);
      h --;
      w --;
    }
  }
  reversible_check(left_tops, reversible_left_tops);
  // 左下方向
  {
    let h = y;
    let w = x;
    while(h <= 5 && w >= 0) {
      left_bottoms.push(field.rows[h].cells[w]);
      h ++;
      w --;
    }
  }
  reversible_check(left_bottoms, reversible_left_bottoms);
  if(reversible_stones.length === 0) {
    error.push('error2');
  }
}

// 反せる石があるか全マス確認
function all_reverse_stone_check() {
  init();
  reversible_stones = [];
  for(let y = 0; y < 6; y ++) {
    for(let x = 0; x < 6; x ++) {
      reverse_stone_check(y, x);
      init();
    }
  }
}

// 石を反す処理
function reverse_stones() {
  reversible_stones.forEach(function(reversible_stone) {
    reversible_stone.firstElementChild.classList.remove(stone_color[turn * -1]);
    reversible_stone.firstElementChild.classList.add(stone_color[turn]);
  })
}
// 正誤判定処理
function answer_check(selected) {
  answer_btn.onclick = function() {
    // 初期化
    answer_btn.disabled = true;
    if(hint_content.classList.contains('close') === false) {
      hint_content.classList.add('close');
    }
    hint_btn.removeEventListener('click', open_hint);
    hint_btn.removeEventListener('click', open_close);
    // 正解の処理
    if(answer_input.value === selected.dataset.answer) {
      selected.firstElementChild.classList.remove('white-stone');
      selected.firstElementChild.classList.add(stone_color[turn]);
      selected.firstElementChild.textContent = '';
      selected.firstElementChild.setAttribute('answer', selected.dataset.answer);
      selected.firstElementChild.setAttribute('question', selected.dataset.question);
      reverse_stones();
    // 不正解の処理
    } else {
      alert('不正解です、ターンが交代します');
    }
    // ゲーム終了、ターン交代処理
    end_game();
    if(end.length === 0) {
      change_turn();
    }
  }
}

// ターン交代処理
function change_turn() {
  // opacity
  for(let y = 0; y < 6; y ++) {
    for(let x = 0; x < 6; x ++) {
      if(field.rows[y].cells[x].firstElementChild.classList.contains('white-stone')) {
        field.rows[y].cells[x].firstElementChild.style.opacity = 0.75;
      }
    }
  }
  // ターン交代
  current_turn.classList.remove(turn_color[turn]);
  current_turn.classList.add(turn_color[turn * -1]);
  turn = turn * -1;
  // 反せる石があるか確認
  all_reverse_stone_check();
  // ターン交代後反せる石がない場合
  if(reversible_stones.length === 0) {
    alert('置けるところがありません\nターンが交代します');
    fin.push('finish1');
    // 再度ターン交代
    current_turn.classList.remove(turn_color[turn]);
    current_turn.classList.add(turn_color[turn * -1]);
    turn = turn * -1;
    // 反せる石があるか確認
    all_reverse_stone_check();
    // ２ターン連続で反せる石がない場合
    if(reversible_stones.length === 0) {
      fin.push('finish2');
    } else {
      fin = [];
    }
  }
  // 勝敗
  end_game();
}

// ヒント
function open_close() {
  hint_content.classList.remove('close');
  hint_btn.removeEventListener('click', open_close);
}

function open_hint() {
  hint_content.textContent = hint;
  if(stone_color[turn] === 'red-stone') {
    red_penalty -= 0.5;
  } else {
    blue_penalty -= 0.5;
  }
  hint_btn.removeEventListener('click', open_hint);
}

// 勝敗
function end_game() {
  red_stone = document.querySelectorAll('.red-stone').length;
  red_current_count.textContent = red_stone + red_penalty + '枚';
  blue_stone = document.querySelectorAll('.blue-stone').length;
  blue_current_count.textContent = blue_stone + blue_penalty + '枚';
  // 全てのマスに石が置き終える
  if(red_stone + blue_stone === masu_wraps.length) {
    end.push('finish');
    if(red_stone > blue_stone) {
      alert('赤の勝利です');
    } else if(red_stone < blue_stone) {
      alert('青の勝利です');
    } else {
      alert('引き分けです');
    }
  // 一方の石が０になる
  } else if(red_stone === 0 || blue_stone === 0) {
    end.push('finish');
    if(red_stone === 0) {
      alert('青の勝利です');
    } else {
      alert('赤の勝利です');
    }
  // ２ターン連続で置く場所がない
  } else if(fin.length === 2) {
    end.push('finish');
    if(red_stone > blue_stone) {
      alert('両者置けるところがありません\n赤の勝利です');
    } else if(red_stone < blue_stone) {
      alert('両者置けるところがありません\n青の勝利です');
    } else {
      alert('両者置けるところがありません\n引き分けです');
    }
  }
}

// 初期化
function init() {
  answer_input.value = '';
  if(hint_content.classList.contains('close') === false) {
    hint_content.classList.add('close');
  }
  masu_wraps.forEach(function(masu_wrap) {
    masu_wrap.firstElementChild.style.fontWeight = 'normal';
    masu_wrap.firstElementChild.removeAttribute('for');
  })
  error = [];
  tops = [];
  reversible_tops = [];
  bottoms = [];
  reversible_bottoms = [];
  rights = [];
  reversible_rights = [];
  lefts = [];
  reversible_lefts = [];
  right_tops = [];
  reversible_right_tops = [];
  right_bottoms = [];
  reversible_right_bottoms = [];
  left_tops = [];
  reversible_left_tops = [];
  left_bottoms = [];
  reversible_left_bottoms = [];
}