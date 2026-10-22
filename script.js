const MENU=[
 {cat:"Burgers",items:[
  {id:"b1",n:"The Classic",d:"Double smash patty, American cheese, pickles, house sauce.",p:8.5,e:"🍔",tag:"Best seller"},
  {id:"b2",n:"Bacon Stack",d:"Two patties, crispy bacon, cheddar, caramelised onions.",p:10.5,e:"🥓"},
  {id:"b3",n:"Hot Honey Chicken",d:"Crispy chicken thigh, hot honey, slaw, brioche bun.",p:9.75,e:"🐔"},
  {id:"b4",n:"Mushroom Melt",d:"Roasted mushrooms, Swiss cheese, garlic mayo.",p:9.25,e:"🍄",tag:"Veggie"},
  {id:"b5",n:"Plant Smash",d:"Plant-based patty, tomato, lettuce, vegan sauce.",p:9.5,e:"🌱",tag:"Vegan"}]},
 {cat:"Sides",items:[
  {id:"s1",n:"Skin-on Fries",d:"Sea salt, crisp outside, fluffy inside.",p:3.5,e:"🍟"},
  {id:"s2",n:"Onion Rings",d:"Beer-battered, with smoky dip.",p:4.25,e:"🧅"},
  {id:"s3",n:"Loaded Fries",d:"Cheese sauce, bacon bits, scallions.",p:5.5,e:"🧀"}]},
 {cat:"Drinks",items:[
  {id:"d1",n:"Fountain Soda",d:"Cola, lemon-lime or root beer. Free refills in store.",p:2.5,e:"🥤"},
  {id:"d2",n:"Vanilla Shake",d:"Thick, cold, real ice cream.",p:5,e:"🥛"},
  {id:"d3",n:"Chocolate Shake",d:"Dark cocoa and a pinch of salt.",p:5,e:"🍫"}]}
];
const TAX=0.08;
let cart={},active=0;
const $=s=>document.querySelector(s);
const money=n=>"$"+n.toFixed(2);
const all=MENU.flatMap(c=>c.items);
const find=id=>all.find(i=>i.id===id);
try{cart=JSON.parse(localStorage.getItem("stackhouse-cart")||"{}")||{};}catch(e){cart={};}
for(const k of Object.keys(cart)){if(!find(k))delete cart[k];}
function save(){try{localStorage.setItem("stackhouse-cart",JSON.stringify(cart));}catch(e){}}
function totals(){let sub=0,cnt=0;for(const[id,q]of Object.entries(cart)){sub+=find(id).p*q;cnt+=q;}return{sub,tax:sub*TAX,total:sub*(1+TAX),cnt};}

function renderTabs(){
  $("#tabs").innerHTML=MENU.map((c,i)=>`<button class="tab" role="tab" aria-selected="${i===active}" data-i="${i}">${c.cat}</button>`).join("");
}
function renderMenu(){
  $("#menu").innerHTML=MENU[active].items.map(i=>`
   <article class="item"><div class="emoji" aria-hidden="true">${i.e}</div>
    <div><h3>${i.n}${i.tag?`<span class="tag">${i.tag}</span>`:""}</h3><p>${i.d}</p><span class="price">${money(i.p)}</span></div>
    <button class="add" data-add="${i.id}" aria-label="Add ${i.n} to order">Add</button></article>`).join("");
}
function renderBar(){
  const t=totals(),b=$("#openCart");
  b.disabled=t.cnt===0;
  $("#cartCount").textContent=t.cnt?`View order (${t.cnt} ${t.cnt===1?"item":"items"})`:"Your order is empty";
  $("#cartTotal").textContent=t.cnt?money(t.total):"";
}
function cartView(){
  const t=totals(),ids=Object.keys(cart);
  if(!ids.length){$("#cartBody").innerHTML=`<h2>Your order</h2><p class="empty">Nothing here yet. Add a burger to get started.</p><div class="row"><button class="btn alt" data-close>Back to menu</button></div>`;return;}
  $("#cartBody").innerHTML=`<h2>Your order</h2>
   ${ids.map(id=>{const i=find(id);return `<div class="line"><span class="emoji" style="font-size:28px" aria-hidden="true">${i.e}</span><span class="nm">${i.n}<br><small style="color:var(--muted)">${money(i.p)} each</small></span>
    <span class="qty"><button data-dec="${id}" aria-label="Remove one ${i.n}">−</button><b aria-live="polite">${cart[id]}</b><button data-inc="${id}" aria-label="Add one ${i.n}">+</button></span></div>`}).join("")}
   <div class="sum"><span>Subtotal</span><span>${money(t.sub)}</span></div>
   <div class="sum"><span>Tax (8%)</span><span>${money(t.tax)}</span></div>
   <div class="sum total"><span>Total</span><span>${money(t.total)}</span></div>
   <div class="row"><button class="btn alt" data-close>Keep browsing</button><button class="btn" data-checkout>Checkout</button></div>`;
}
function checkoutView(){
  $("#cartBody").innerHTML=`<h2>Checkout</h2>
   <div class="seg" role="radiogroup" aria-label="Order type">
    <label><input type="radio" name="mode" value="Pickup" checked><span>Pickup</span></label>
    <label><input type="radio" name="mode" value="Delivery"><span>Delivery</span></label></div>
   <label for="nm">Name</label><input id="nm" autocomplete="name">
   <label for="ph">Phone number</label><input id="ph" type="tel" autocomplete="tel">
   <div id="addrWrap" hidden><label for="ad">Delivery address</label><textarea id="ad" rows="2" autocomplete="street-address"></textarea></div>
   <label for="nt">Notes for the kitchen (optional)</label><input id="nt" placeholder="No pickles, extra sauce…">
   <div class="err" id="err" role="alert"></div>
   <div class="row"><button class="btn alt" data-back>Back</button><button class="btn" data-place>Place order · ${money(totals().total)}</button></div>`;
}
function doneView(name,mode,num){
  $("#cartBody").innerHTML=`<div class="done"><div class="big" aria-hidden="true">🍔</div><h2>Order placed</h2>
   <p>Thanks, ${name.replace(/[<>&]/g,"")}. Your ${mode.toLowerCase()} order is in the kitchen.</p>
   <div class="num">#${num}</div><p class="empty">Show this number at the counter.</p>
   <div class="row"><button class="btn" data-close>Done</button></div></div>`;
}
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-i],[data-add],[data-inc],[data-dec],[data-close],[data-checkout],[data-back],[data-place]");
  if(!t)return;const d=t.dataset;
  if(d.i!==undefined){active=+d.i;renderTabs();renderMenu();}
  else if(d.add){cart[d.add]=(cart[d.add]||0)+1;save();renderBar();t.textContent="Added ✓";setTimeout(()=>t.textContent="Add",700);}
  else if(d.inc){cart[d.inc]++;save();cartView();renderBar();}
  else if(d.dec){if(--cart[d.dec]<=0)delete cart[d.dec];save();cartView();renderBar();}
  else if(t.hasAttribute("data-close"))$("#cartDlg").close();
  else if(t.hasAttribute("data-checkout"))checkoutView();
  else if(t.hasAttribute("data-back"))cartView();
  else if(t.hasAttribute("data-place")){
    const nm=$("#nm").value.trim(),ph=$("#ph").value.trim(),mode=document.querySelector('input[name=mode]:checked').value,ad=$("#ad").value.trim();
    if(!nm)return $("#err").textContent="Enter your name so we can call it out.";
    if(ph.replace(/\D/g,"").length<7)return $("#err").textContent="Enter a phone number we can reach.";
    if(mode==="Delivery"&&!ad)return $("#err").textContent="Enter a delivery address.";
    const num=Math.floor(100+Math.random()*900);
    cart={};save();renderBar();doneView(nm,mode,num);
  }
});
document.addEventListener("change",e=>{
  if(e.target.name==="mode")$("#addrWrap").hidden=e.target.value!=="Delivery";
});
$("#openCart").addEventListener("click",()=>{cartView();$("#cartDlg").showModal();});
renderTabs();renderMenu();renderBar();
