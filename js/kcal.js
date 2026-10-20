/* AI food kcal page. Loaded AFTER the page parts are inserted (see include.js / index.php). */
/* Wrapped in a single object so nothing leaks into your site's global scope except `xtCal`. */
var xtCal = (function () {
  const API = "https://xteam-slm2.onrender.com/api";
  const $ = id => document.getElementById(id);

  let foodData = null, originalImageFile = null;
  let imageNaturalSize = { w: 0, h: 0 }, imageDisplaySize = { w: 0, h: 0 };
  let activeDrag = null, dragOffset = { x: 0, y: 0 };

  const wrapper = $('xtAnnotatedWrapper'), baseImg = $('xtAnnotatedBase');

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) { originalImageFile = file; processImage(file); }
    e.target.value = '';
  }

  async function processImage(file) {
    $('xtPreviewContainer').style.display = "block";
    $('xtFoodListArea').style.display = "none";
    wrapper.style.display = "none";
    $('xtTotalArea').style.display = "none";
    $('xtLoading').style.display = "block";
    wrapper.querySelectorAll('.label-tag').forEach(el => el.remove());

    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(API + "/analyze-meal", { method: "POST", body: fd });
      foodData = await res.json();
      $('xtLoading').style.display = "none";
      if (foodData.error) { alert("识别失败：" + foodData.error); return; }

      const img = new Image();
      img.onload = () => {
        imageNaturalSize.w = img.naturalWidth;
        imageNaturalSize.h = img.naturalHeight;
        baseImg.onload = () => {
          imageDisplaySize.w = baseImg.clientWidth;
          imageDisplaySize.h = baseImg.clientHeight;
          renderLabels();
        };
        baseImg.src = img.src;
      };
      img.src = URL.createObjectURL(file);

      renderFoodList();
      wrapper.style.display = "block";
      $('xtTotalArea').style.display = "grid";
      $('xtFoodListArea').style.display = "block";
      $('xtHandBadge').style.display = foodData.has_hand ? "inline-block" : "none";
      $('xtFoodListArea').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      $('xtLoading').style.display = "none";
      alert("网络错误：" + err.message);
    }
  }

  function renderLabels() {
    wrapper.querySelectorAll('.label-tag').forEach(el => el.remove());
    if (!foodData || !foodData.foods) return;
    const scaleX = imageDisplaySize.w / imageNaturalSize.w;
    const scaleY = imageDisplaySize.h / imageNaturalSize.h;
    foodData.foods.forEach((item, idx) => {
      let x = (item.x ?? imageNaturalSize.w * 0.5) * scaleX;
      let y = (item.y ?? imageNaturalSize.h * 0.5) * scaleY;
      x = Math.max(40, Math.min(x, imageDisplaySize.w - 40));
      y = Math.max(30, Math.min(y, imageDisplaySize.h - 30));

      const tag = document.createElement('div');
      tag.className = 'label-tag';
      tag.dataset.index = idx;
      tag.innerHTML = '<div class="food-name"></div><div class="food-cal"></div>';
      tag.querySelector('.food-name').textContent = item.food_name ?? '食物';
      tag.querySelector('.food-cal').textContent = `${item.calories ?? 0} kcal`;
      tag.style.left = `${x}px`;
      tag.style.top = `${y}px`;
      tag.style.transform = 'translate(-50%, -50%)';
      tag.addEventListener('mousedown', e => startDrag(e, tag, idx));
      tag.addEventListener('touchstart', e => startDrag(e, tag, idx), { passive: false });
      wrapper.appendChild(tag);
    });
  }

  function startDrag(e, tag, idx) {
    e.preventDefault();
    activeDrag = { tag, idx };
    const rect = tag.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.x = cx - rect.left - rect.width / 2;
    dragOffset.y = cy - rect.top - rect.height / 2;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  function onDrag(e) {
    if (!activeDrag) return;
    e.preventDefault();
    const r = wrapper.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    let x = cx - r.left - dragOffset.x;
    let y = cy - r.top - dragOffset.y;
    x = Math.max(40, Math.min(x, imageDisplaySize.w - 40));
    y = Math.max(30, Math.min(y, imageDisplaySize.h - 30));
    activeDrag.tag.style.left = `${x}px`;
    activeDrag.tag.style.top = `${y}px`;
    foodData.foods[activeDrag.idx].x = x * (imageNaturalSize.w / imageDisplaySize.w);
    foodData.foods[activeDrag.idx].y = y * (imageNaturalSize.h / imageDisplaySize.h);
  }

  function endDrag() {
    activeDrag = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);
  }

  function renderFoodList() {
    $("xtFoodItems").innerHTML = foodData.foods.map(createFoodItemHTML).join("");
    updateTotals();
  }

  function createFoodItemHTML(item, idx) {
    return `<div class="food-item xt-card">
      <button class="btn-delete" onclick="xtCal.removeFood(${idx})">删除</button>
      <strong>食物 ${idx + 1}</strong><div style="margin-top:6px;"></div>
      <p>名　　称：<input value="${esc(item.food_name)}" onchange="xtCal.updateFood(${idx},'food_name',this.value)"></p>
      <p>克　　数：<input type="number" value="${esc(item.weight_g)}" onchange="xtCal.updateFood(${idx},'weight_g',Number(this.value))"> g</p>
      <p>卡 路 里：<input type="number" value="${esc(item.calories)}" onchange="xtCal.updateFood(${idx},'calories',Number(this.value))"> kcal</p>
      <p>蛋 白 质：<input type="number" value="${esc(item.protein_g)}" onchange="xtCal.updateFood(${idx},'protein_g',Number(this.value))"> g</p>
      <p>膳 食 纤 维：<input type="number" value="${esc(item.fibre_g)}" onchange="xtCal.updateFood(${idx},'fibre_g',Number(this.value))"> g</p>
      ${item.note ? `<p class="note-text">📝 ${esc(item.note)}</p>` : ''}
    </div>`;
  }

  function updateFood(i, f, v) {
    foodData.foods[i][f] = v;
    const tag = wrapper.querySelector(`.label-tag[data-index="${i}"]`);
    if (tag) {
      if (f === 'food_name') tag.querySelector('.food-name').textContent = v;
      if (f === 'calories') tag.querySelector('.food-cal').textContent = `${v} kcal`;
    }
  }

  function removeFood(i) {
    foodData.foods.splice(i, 1);
    renderFoodList();
    renderLabels();
  }

  function addFoodItem() {
    foodData.foods.push({
      food_name: "新食物", weight_g: 100, calories: 0, protein_g: 0, fibre_g: 0, note: "",
      x: imageNaturalSize.w / 2, y: imageNaturalSize.h / 2
    });
    renderFoodList();
    renderLabels();
  }

  async function recalculate() {
    try {
      const r = await fetch(API + "/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_hand: foodData.has_hand, foods: foodData.foods })
      });
      foodData = await r.json();
      updateTotals();
      renderLabels();
    } catch (err) {
      alert("网络错误：" + err.message);
    }
  }

  function updateTotals() {
    $("xtTotalCal").innerText = foodData.total_calories;
    $("xtTotalProtein").innerText = foodData.total_protein_g;
    $("xtTotalFibre").innerText = foodData.total_fibre_g;
    const goal = parseFloat(getComputedStyle($('xtCalRoot')).getPropertyValue('--xt-goal')) || 2000;
    const pct = Math.min(1, (Number(foodData.total_calories) || 0) / goal);
    $('xtRing').style.strokeDashoffset = 263.9 * (1 - pct);
    $('xtPct').textContent = Math.round(pct * 100) + '%';
  }

  return { handleFileSelect, updateFood, removeFood, addFoodItem, recalculate };
})();
