
const STORAGE_KEY = "spiritus-static-v5";
const TOTAL_DAYS = 50;
const FIXED_START_DATE = "2026-04-05";
const FRUITS = ["Amour","Joie","Paix","Patience","Bonté","Bienveillance","Fidélité","Douceur","Maîtrise de soi"];
const PRAYER_STYLES = ["Liturgie des Heures","Louange","Lectio divina","Chapelet","Chapelet de la miséricorde","Adoration","Prière spontanée"];
const INVOCATIONS = ["Veni Creator","Viens Esprit de sainteté","Esprit de Lumière"];

const SPECIAL_DAYS = {
  1: "Dimanche de Pâques",
  2 : "Octave de Pâques",
  3 : "Octave de Pâques",
  4 : "Octave de Pâques",
  5 : "Octave de Pâques",
  7 : "Octave de Pâques",
  8: "2e dimanche de Pâques",
  21: "Saint Marc",
  15: "3e dimanche de Pâques",
  22: "4e dimanche de Pâques",
  29: "5e dimanche de Pâques",
  40: "Ascension",
  36: "6e dimanche de Pâques",
  43: "6e dimanche de Pâques",
  50: "Pentecôte"
};


function createDefaultDailyState(){
  const daily={};
  for(let i=1;i<=TOTAL_DAYS;i++){
    daily[i]={invocationDone:false,actsRead:false,meditationRead:false,prayerDone:false,prayerMinutes:10,eveningReviewDone:false,fridayPenanceDone:false,gratitude:"",spiritDiscernment:"",fruitsChecked:[]};
  }
  return daily;
}
function createDefaultState(){
  return{
    currentDay:1,
    settings:{defaultInvocation:INVOCATIONS[0],fridayPenance:"Reprendre une ascèse du Carême ou poser un acte concret de charité.",postLentResolution:"Choisir un rapport plus juste aux écrans, au sommeil, à l’alimentation ou au sport."},
    weeklyChoices:Array.from({length:7},(_,i)=>({week:i+1,gift:window.SPIRITUS_GIFTS[i].name,prayerStyle:PRAYER_STYLES[i],personalIntention:""})),
    daily:createDefaultDailyState()
  };
}
function isoToday(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;}
function dayDiff(fromIso,toIso){const start=new Date(`${fromIso}T00:00:00`);const end=new Date(`${toIso}T00:00:00`);return Math.floor((end-start)/86400000);}
function getJourneyDay(today=isoToday()){const diff=dayDiff(FIXED_START_DATE,today);if(diff<0)return 1;if(diff>=TOTAL_DAYS)return TOTAL_DAYS;return diff+1;}
function getWeek(day){return Math.min(7,Math.ceil(day/7));}
function getWeekRange(week){const start=(week-1)*7+1;const end=Math.min(TOTAL_DAYS,week*7);return[start,end];}
function isFridayForJourneyDay(day){const date=new Date(`${FIXED_START_DATE}T00:00:00`);date.setDate(date.getDate()+(day-1));return date.getDay()===5;}
function percent(done,total){return total?Math.round((done/total)*100):0;}
function dayTaskCount(dayState){return [dayState.invocationDone,dayState.actsRead,dayState.meditationRead,dayState.prayerDone,dayState.eveningReviewDone,dayState.fridayPenanceDone].filter(Boolean).length;}
function loadState(){
  const fallback=createDefaultState();
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw){fallback.currentDay=getJourneyDay();return fallback;}
    const parsed=JSON.parse(raw);
    return{...fallback,...parsed,settings:{...fallback.settings,...(parsed.settings||{})},weeklyChoices:Array.isArray(parsed.weeklyChoices)?parsed.weeklyChoices:fallback.weeklyChoices,daily:{...fallback.daily,...(parsed.daily||{})},currentDay:typeof parsed.currentDay==="number"?parsed.currentDay:getJourneyDay()};
  }catch{return {...fallback,currentDay:getJourneyDay()};}
}
let state=loadState(); let showFullText=false;
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function currentContent(){return window.SPIRITUS_CONTENT[state.currentDay-1];}
function updateDay(patch){state.daily[state.currentDay]={...state.daily[state.currentDay],...patch};saveState();render();}
function updateSettings(patch){state.settings={...state.settings,...patch};saveState();render();}
function updateWeek(index,patch){state.weeklyChoices[index]={...state.weeklyChoices[index],...patch};saveState();render();}
function setCurrentDay(day){state.currentDay=Math.max(1,Math.min(TOTAL_DAYS,day));showFullText=false;saveState();render();}
function resetDay(){const fresh=createDefaultDailyState();state.daily[state.currentDay]=fresh[state.currentDay];saveState();render();}
function resetWeek(){const fresh=createDefaultDailyState();const[start,end]=getWeekRange(getWeek(state.currentDay));for(let day=start;day<=end;day++)state.daily[day]=fresh[day];saveState();render();}

function performResetAll(){
  state=createDefaultState();
  state.currentDay=getJourneyDay();
  showFullText=false;
  saveState();
  render();
}
function openResetModal(){
  const modal=document.getElementById("confirmModal");
  if(!modal) return;
  modal.classList.remove("hidden");
}
function closeResetModal(){
  const modal=document.getElementById("confirmModal");
  if(!modal) return;
  modal.classList.add("hidden");
}
function resetAll(){
  openResetModal();
}
function toggleFruit(fruit){const set=new Set(state.daily[state.currentDay].fruitsChecked);if(set.has(fruit))set.delete(fruit);else set.add(fruit);updateDay({fruitsChecked:Array.from(set)});}
function formatFrenchDate(iso){const d=new Date(`${iso}T00:00:00`);return d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function currentGiftData(){return window.SPIRITUS_GIFTS[getWeek(state.currentDay)-1];}
function getSpecialDayLabel(day){return SPECIAL_DAYS[day] || "";}
function populateStaticSelects(){document.getElementById("defaultInvocation").innerHTML=INVOCATIONS.map(v=>`<option value="${v}">${v}</option>`).join("");document.getElementById("weekPrayerStyle").innerHTML=PRAYER_STYLES.map(v=>`<option value="${v}">${v}</option>`).join("");}
function bindEvents(){
  document.getElementById("prevBtn").addEventListener("click",()=>setCurrentDay(state.currentDay-1));
  document.getElementById("todayBtn").addEventListener("click",()=>setCurrentDay(getJourneyDay()));
  document.getElementById("nextBtn").addEventListener("click",()=>setCurrentDay(state.currentDay+1));
  document.getElementById("toggleTextBtn").addEventListener("click",()=>{showFullText=!showFullText;render();});
  document.getElementById("scrollToReadingBtn").addEventListener("click",()=>{document.getElementById("readingSection").scrollIntoView({behavior:"smooth",block:"start"});});
  document.getElementById("invocationDone").addEventListener("change",e=>updateDay({invocationDone:e.target.checked}));
  document.getElementById("actsRead").addEventListener("change",e=>updateDay({actsRead:e.target.checked}));
  document.getElementById("meditationRead").addEventListener("change",e=>updateDay({meditationRead:e.target.checked}));
  document.getElementById("prayerMinutes").addEventListener("input",e=>updateDay({prayerMinutes:Number(e.target.value||0)}));
  document.getElementById("prayerDoneBtn").addEventListener("click",()=>updateDay({prayerDone:!state.daily[state.currentDay].prayerDone}));
  document.getElementById("gratitude").addEventListener("input",e=>updateDay({gratitude:e.target.value}));
  document.getElementById("spiritDiscernment").addEventListener("input",e=>updateDay({spiritDiscernment:e.target.value}));
  document.getElementById("reviewDoneBtn").addEventListener("click",()=>updateDay({eveningReviewDone:!state.daily[state.currentDay].eveningReviewDone}));
  document.getElementById("resetDayBtn").addEventListener("click",resetDay);
  document.getElementById("resetWeekBtn").addEventListener("click",resetWeek);
  document.getElementById("resetAllBtn").addEventListener("click",resetAll);
  document.getElementById("cancelResetBtn").addEventListener("click",closeResetModal);
  document.getElementById("confirmResetBtn").addEventListener("click",()=>{closeResetModal();performResetAll();});
  document.getElementById("confirmModal").addEventListener("click",(e)=>{if(e.target.id==="confirmModal") closeResetModal();});
  document.getElementById("defaultInvocation").addEventListener("change",e=>updateSettings({defaultInvocation:e.target.value}));
  document.getElementById("fridayPenance").addEventListener("input",e=>updateSettings({fridayPenance:e.target.value}));
  document.getElementById("postLentResolution").addEventListener("input",e=>updateSettings({postLentResolution:e.target.value}));
  document.getElementById("weekPrayerStyle").addEventListener("change",e=>updateWeek(getWeek(state.currentDay)-1,{prayerStyle:e.target.value}));
  document.getElementById("weekIntention").addEventListener("input",e=>updateWeek(getWeek(state.currentDay)-1,{personalIntention:e.target.value}));
}
function renderFruits(dayState){const box=document.getElementById("fruitsBox");box.innerHTML=FRUITS.map(fruit=>`<label class="fruit-item ${dayState.fruitsChecked.includes(fruit)?"active":""}"><input type="checkbox" data-fruit="${fruit}" ${dayState.fruitsChecked.includes(fruit)?"checked":""}><span>${fruit}</span></label>`).join("");box.querySelectorAll("input[type=checkbox]").forEach(el=>el.addEventListener("change",e=>toggleFruit(e.target.dataset.fruit)));}
function renderWeekGrid(){const week=getWeek(state.currentDay);const[start,end]=getWeekRange(week);const grid=document.getElementById("weekGrid");grid.innerHTML="";for(let day=start;day<=end;day++){const btn=document.createElement("button");btn.type="button";btn.className=`daychip ${day===state.currentDay?"active":""}`;btn.innerHTML=`<div>J${day}</div><div class="muted" style="font-size:12px;margin-top:4px">${dayTaskCount(state.daily[day])}/${isFridayForJourneyDay(day)&&!(day>=1&&day<=8)?6:5}</div>`;btn.addEventListener("click",()=>setCurrentDay(day));grid.appendChild(btn);}}
function renderProgress(){const isPenanceFriday=isFridayForJourneyDay(state.currentDay)&&!(state.currentDay>=1&&state.currentDay<=8);document.getElementById("dayProgress").textContent=`${percent(dayTaskCount(state.daily[state.currentDay]),isPenanceFriday?6:5)}%`;const week=getWeek(state.currentDay);const[start,end]=getWeekRange(week);let weekDone=0,weekTotal=0;for(let d=start;d<=end;d++){weekDone+=dayTaskCount(state.daily[d]);weekTotal+=(isFridayForJourneyDay(d)&&!(d>=1&&d<=8))?6:5;}document.getElementById("weekLabel").textContent=`Semaine ${week}`;document.getElementById("weekProgress").textContent=`${percent(weekDone,weekTotal)}%`;let overallDone=0,overallTotal=0;for(let d=1;d<=TOTAL_DAYS;d++){overallDone+=dayTaskCount(state.daily[d]);overallTotal+=(isFridayForJourneyDay(d)&&!(d>=1&&d<=8))?6:5;}document.getElementById("overallProgress").textContent=`${percent(overallDone,overallTotal)}%`;}
function renderFridayCard(){const card=document.getElementById("fridayCard");const isFriday=isFridayForJourneyDay(state.currentDay);const isPenanceFriday=isFriday&&!(state.currentDay>=1&&state.currentDay<=8);if(!isFriday){card.classList.add("hidden");return;}card.classList.remove("hidden");if(isPenanceFriday){card.innerHTML=`<div class="task-title">Vendredi de pénitence</div><p class="top-space">${state.settings.fridayPenance}</p><label class="checkline fixed-check top-space"><input type="checkbox" id="fridayPenanceDone" ${state.daily[state.currentDay].fridayPenanceDone?"checked":""}> <span>Pénitence vécue</span></label>`;document.getElementById("fridayPenanceDone").addEventListener("change",e=>updateDay({fridayPenanceDone:e.target.checked}));}else{card.innerHTML=`<div class="task-title">Vendredi dans l’octave de Pâques</div><p class="top-space">Dans l’octave de Pâques, le vendredi n’est pas vécu comme un jour de pénitence : on demeure dans la joie pascale.</p>`;}}
function renderGiftQuote(targetId,giftData){document.getElementById(targetId).innerHTML=`<div class="gift-quote">${giftData.quote}</div><span class="gift-ref">${giftData.ref}</span>`;}
function render(){
  const content=currentContent();const dayState=state.daily[state.currentDay];const week=getWeek(state.currentDay);const weekChoice=state.weeklyChoices[week-1];const giftData=currentGiftData();const isFriday=isFridayForJourneyDay(state.currentDay);const isPenanceFriday=isFriday&&!(state.currentDay>=1&&state.currentDay<=8);const specialDayLabel=getSpecialDayLabel(state.currentDay);
  document.getElementById("dateTitle").textContent=`${capitalize(formatFrenchDate(content.date))} — Jour ${state.currentDay}`;
  document.getElementById("dayMeta").innerHTML=`<span class="badge">Semaine ${week}</span><span class="badge">Don : ${giftData.name}</span>${specialDayLabel?`<span class="badge ok">${specialDayLabel}</span>`:""}${isFriday?`<span class="badge ${isPenanceFriday?"warn":"ok"}">${isPenanceFriday?"Vendredi de pénitence":"Vendredi dans l’octave de Pâques"}</span>`:""}`;
  document.getElementById("weekBadges").innerHTML=`<span class="badge">Don de la semaine : ${giftData.name}</span><span class="badge">Invocation : ${state.settings.defaultInvocation}</span><span class="badge">Date liturgique : ${content.date}</span>${specialDayLabel?`<span class="badge ok">${specialDayLabel}</span>`:""}`;
  document.getElementById("invocationText").textContent=`Chant proposé : ${state.settings.defaultInvocation}. Don demandé cette semaine : ${giftData.name}.`;
  renderGiftQuote("giftQuoteInvocation", giftData);
  renderGiftQuote("giftQuoteWeek", giftData);
  document.getElementById("chantLink").href=`chant.html?chant=${encodeURIComponent(state.settings.defaultInvocation)}`;
  document.getElementById("readingPreview").textContent=`${content.reference} — ${content.excerpt}`;
  document.getElementById("readingRef").textContent=content.reference;
  document.getElementById("readingExcerpt").textContent=content.excerpt;
  document.getElementById("readingFull").textContent=content.fullText||"Texte à compléter.";
  document.getElementById("readingFull").classList.toggle("hidden",!showFullText);
  document.getElementById("toggleTextBtn").textContent=showFullText?"Masquer le texte":"Lire le texte";
  document.getElementById("meditationText").textContent=content.meditation||"(à venir)";
  document.getElementById("invocationDone").checked=!!dayState.invocationDone;
  document.getElementById("actsRead").checked=!!dayState.actsRead;
  document.getElementById("meditationRead").checked=!!dayState.meditationRead;
  document.getElementById("prayerMinutes").value=dayState.prayerMinutes ?? 10;
  document.getElementById("gratitude").value=dayState.gratitude||"";
  document.getElementById("spiritDiscernment").value=dayState.spiritDiscernment||"";
  document.getElementById("prayerDoneBtn").textContent=dayState.prayerDone?"Oraison faite":"Valider l’oraison";
  document.getElementById("reviewDoneBtn").textContent=dayState.eveningReviewDone?"Relecture validée":"Valider la relecture";
  document.getElementById("defaultInvocation").value=state.settings.defaultInvocation;
  document.getElementById("fridayPenance").value=state.settings.fridayPenance;
  document.getElementById("postLentResolution").value=state.settings.postLentResolution;
  document.getElementById("resolutionText").textContent=state.settings.postLentResolution;
  document.getElementById("weekSummary").innerHTML=`<span class="badge">Don de la semaine : ${giftData.name}</span><div class="muted top-space">Choisir chaque semaine une manière de prier et une intention personnelle.</div>`;
  document.getElementById("weekPrayerStyle").value=weekChoice.prayerStyle;
  document.getElementById("weekIntention").value=weekChoice.personalIntention||"";
  renderFruits(dayState);renderWeekGrid();renderProgress();renderFridayCard();
}
populateStaticSelects();
bindEvents();
render();
