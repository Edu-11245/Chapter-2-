(function(){
'use strict';
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var ROOT=$('#exam-root');
if(!ROOT)return;
var STORE={active:'eto_exam_active_v1',results:'eto_exam_results_v1'},memoryStore={};
var active=null,timer=null,exams=Array.isArray(window.EXAMS)?window.EXAMS:[];
function read(k,fallback){try{var v=localStorage.getItem(k);return v?JSON.parse(v):fallback}catch(e){try{return memoryStore[k]?JSON.parse(memoryStore[k]):fallback}catch(x){return fallback}}}
function write(k,v){var raw=JSON.stringify(v);try{localStorage.setItem(k,raw);return true}catch(e){memoryStore[k]=raw;return true}}
function remove(k){try{localStorage.removeItem(k)}catch(e){}delete memoryStore[k]}
function toast(s){var t=$('#toast');if(!t)return;t.textContent=s;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(function(){t.style.display='none'},2400)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function nl(v){return esc(v).replace(/\n/g,'<br>')}
function safeUrl(v){var s=String(v||'').trim();if(!s)return'';if(/^(https?:\/\/|\.\.?\/|\/)/i.test(s))return s;return''}
function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=b[i];b[i]=b[j];b[j]=t}return b}
function examById(id){return exams.find(function(e){return e.id===id})}
function results(){var r=read(STORE.results,[]);return Array.isArray(r)?r:[]}
function latest(id){var r=results().filter(function(x){return x.examId===id});return r.length?r[r.length-1]:null}
function completed(id){return!!latest(id)}
function isUnlocked(e){return!e.requiredExamId||completed(e.requiredExamId)}
function getAccent(c){var m={teal:'var(--teal)',amber:'var(--amber)',violet:'var(--violet)',coral:'var(--coral)',blue:'var(--blue)',green:'var(--green)'};return m[c]||m.teal}
function getCardStyle(s){return['soft','solid','outline','gradient'].indexOf(s)>-1?s:'soft'}
var THEMES='classic ocean lavender mint sunset rose midnight glass paper neon royal forest coral sky mono aurora academic playful espresso arctic'.split(' ');
function themeOf(e){return THEMES.indexOf(e&&e.theme)>-1?e.theme:'classic'}
function renderCards(){
 var html='';
 if(!exams.length){ROOT.innerHTML='<div class="exam-empty">لسه مفيش امتحانات. أضف امتحانات من محرر الامتحانات ثم حدّث ملف Data/exams.js.</div>';return}
 exams.forEach(function(e,i){
  var done=latest(e.id),unlocked=isUnlocked(e),theme=themeOf(e),accent=getAccent(e.accent),total=(e.questions||[]).length;
  var status=!unlocked?'مقفل':done?'مكتمل':'متاح';
  var action=!unlocked?'<button class="btn alt" disabled>أكملي الامتحان السابق</button>':done&&!e.allowRetry?'<button class="btn alt" disabled>تم إنهاؤه</button>':'<button class="btn exam-start" data-start="'+esc(e.id)+'">'+(done?'إعادة الامتحان':'ابدئي الامتحان')+'</button>';
  html+='<article class="exam-card exam-theme-'+theme+'" style="--exam-ac:'+accent+'">'+
   '<div class="exam-card-top"><span class="exam-icon">'+esc(e.icon||'✎')+'</span><span class="exam-status '+(!unlocked?'locked':done?'done':'ready')+'">'+status+'</span></div>'+
   '<h3>'+esc(e.title||'امتحان بدون اسم')+'</h3><p>'+esc(e.description||'')+'</p>'+
   '<div class="exam-meta"><span>'+total+' سؤال</span><span>'+Math.max(1,+e.duration||1)+' دقيقة</span><span>'+Math.max(0,+e.passMark||0)+'% للنجاح</span></div>'+
   (done?'<div class="exam-last">آخر نتيجة: <b>'+done.percent+'%</b> · '+(done.passed?'ناجحة':'حاولي تاني')+'</div>':'')+
   '<div class="exam-card-action">'+action+'</div></article>';
 });
 ROOT.innerHTML='<div class="exam-grid">'+html+'</div>';
}
function makeAttempt(e){
 var order=(e.questions||[]).map(function(q){return q.id});
 if(e.shuffleQuestions)order=shuffle(order);
 var optionOrders={},orderingOrders={};
 (e.questions||[]).forEach(function(q){if(q.type==='mcq'){var ids=q.options.map(function(_,i){return i});optionOrders[q.id]=e.shuffleOptions?shuffle(ids):ids}else if(q.type==='ordering'){orderingOrders[q.id]=shuffle(q.items.map(function(_,i){return i}))}});
 var now=Date.now();
 return{examId:e.id,startedAt:now,endAt:now+Math.max(1,+e.duration||1)*60000,order:order,optionOrders:optionOrders,orderingOrders:orderingOrders,answers:{},index:0};
}
function focusExamPage(){var page=$('#pg-exam');if(page){$$('.wrap > .pg').forEach(function(x){x.classList.toggle('off',x!==page)});page.classList.remove('off')} $$('#pages .pg-b').forEach(function(b){b.setAttribute('aria-selected',b.dataset.p==='exam')})}
function pinExamHistory(){try{history.pushState({etoExamLock:true},'','#exam')}catch(e){}focusExamPage()}
function startExam(id){var e=examById(id);if(!e||!isUnlocked(e))return;if(completed(id)&&!e.allowRetry){toast('تم إنهاء هذا الامتحان.');return}
 active=makeAttempt(e);write(STORE.active,active);document.body.classList.add('exam-active');pinExamHistory();renderAttempt();}
function resumeAttempt(a){var e=examById(a.examId);if(!e){remove(STORE.active);return}active=a;document.body.classList.add('exam-active');pinExamHistory();renderAttempt();}
function save(){if(active)write(STORE.active,active)}
function currentExam(){return active?examById(active.examId):null}
function currentQuestion(){var e=currentExam();if(!e)return null;var id=active.order[active.index];return(e.questions||[]).find(function(q){return q.id===id})||null}
function answered(q){var a=active.answers[q.id];if(q.type==='matching')return a&&Object.keys(a).length===q.pairs.length;if(q.type==='ordering')return Array.isArray(a)&&a.length===q.items.length;if(q.type==='short'||q.type==='fill')return typeof a==='string'&&a.trim()!=='';return a!==undefined&&a!==null}
function renderAnswer(q){var a=active.answers[q.id],h='';
 if(q.type==='mcq'){
  var order=active.optionOrders[q.id]||q.options.map(function(_,i){return i});
  h='<div class="exam-options">'+order.map(function(original){var checked=String(a)===String(original);return'<label class="exam-option '+(checked?'selected':'')+'"><input type="radio" name="exam-answer" value="'+original+'" '+(checked?'checked':'')+'><span>'+nl(q.options[original])+'</span></label>'}).join('')+'</div>';
 }else if(q.type==='truefalse'){
  h='<div class="exam-options two">'+[{v:'true',t:'صح'},{v:'false',t:'غلط'}].map(function(x){var checked=String(a)===x.v;return'<label class="exam-option '+(checked?'selected':'')+'"><input type="radio" name="exam-answer" value="'+x.v+'" '+(checked?'checked':'')+'><span>'+x.t+'</span></label>'}).join('')+'</div>';
 }else if(q.type==='short'||q.type==='fill'){
  h='<label class="exam-answer-label">اكتبي إجابتك</label><input class="exam-text-answer" id="exam-text-answer" type="text" autocomplete="off" value="'+esc(a||'')+'" placeholder="اكتبي الإجابة هنا...">';
 }else if(q.type==='matching'){
  var rights=shuffle(q.pairs.map(function(p,i){return{v:String(i),t:p.right}}));
  h='<div class="exam-matching">'+q.pairs.map(function(p,i){var val=a&&a[i]!==undefined?String(a[i]):'';return'<label class="exam-match-row"><span>'+nl(p.left)+'</span><select data-match="'+i+'"><option value="">اختاري المطابقة</option>'+rights.map(function(x){return'<option value="'+x.v+'" '+(val===x.v?'selected':'')+'>'+esc(x.t)+'</option>'}).join('')+'</select></label>'}).join('')+'</div>';
 }else if(q.type==='ordering'){
  var order=Array.isArray(a)?a.slice():(active.orderingOrders[q.id]||shuffle(q.items.map(function(_,i){return i}))).slice();
  h='<div class="exam-order-list">'+order.map(function(item,pos){return'<div class="exam-order-item"><span>'+nl(q.items[item])+'</span><div><button type="button" data-move="up" data-pos="'+pos+'" aria-label="تحريك لأعلى" '+(pos===0?'disabled':'')+'>↑</button><button type="button" data-move="down" data-pos="'+pos+'" aria-label="تحريك لأسفل" '+(pos===order.length-1?'disabled':'')+'>↓</button></div></div>'}).join('')+'</div><p class="exam-help">استخدمي السهمين لترتيب العناصر.</p>';
 }
 return h;
}
/* ---- Arabic speech helper: chemistry formulas -> Arabic names, plus diacritics for common words ---- */
var SP=(function(){
 var SUN='تثدذرزسشصضطظلن',SUPS='⁰¹²³⁴⁵⁶⁷⁸⁹';
 var LET={A:'إِيه',B:'بِي',C:'سِي',D:'دِي',E:'إِي',F:'إِفْ',G:'جِي',H:'إِتْش',I:'آي',J:'جَيْ',K:'كَيْ',L:'إِلْ',M:'إِمْ',N:'إِنْ',O:'أُو',P:'بِي',Q:'كِيُو',R:'آرْ',S:'إِسْ',T:'تِي',U:'يُو',V:'فِي',W:'دَبْلْيُو',X:'إِكْس',Y:'وَايْ',Z:'زِي'};
 var DIG=['صِفْر','وَاحِد','اثْنَيْن','ثَلَاثَة','أَرْبَعَة','خَمْسَة','سِتَّة','سَبْعَة','ثَمَانِيَة','تِسْعَة'];
 var LABEL={A:1,B:1,C:1,D:1,E:1,X:1,Y:1,Z:1};
 var ROMAN={II:'اثْنَيْن',III:'ثَلَاثَة',IV:'أَرْبَعَة'};
 var UNIT={g:'جْرَام',mL:'مِلِّي لِتْر',ml:'مِلِّي لِتْر',mol:'مُول',M:'مُولَر',L:'لِتْر',pH:'بِي إِتْش',ppm:'جُزْء فِي المِلْيُون'};
 /* elements / cations: symbol -> [bare Arabic name, fixed charge] */
 var ELEM={H:['هَيْدْرُوجِين',1],Li:['لِيثِيُوم',1],Na:['صُودْيُوم',1],K:['بُوتَاسِيُوم',1],Ag:['فِضَّة',1],NH4:['أَمُونِيُوم',1],
  Mg:['مَغْنِيسِيُوم',2],Ca:['كَالْسِيُوم',2],Ba:['بَارِيُوم',2],Sr:['سْتْرُونْشِيُوم',2],Zn:['خَارْصِين',2],Ni:['نِيكِل',2],Al:['أَلُومِنْيُوم',3],
  Fe:['حَدِيد',0],Cu:['نُحَاس',0],Hg:['زِئْبَق',0],Pb:['رَصَاص',0],Sn:['قَصْدِير',0],Mn:['مَنْجَنِيز',0],Cr:['كْرُوم',0],Co:['كُوبَالْت',0],Au:['ذَهَب',0],
  C:['كَرْبُون',0],N:['نِيتْرُوجِين',0],O:['أُكْسُجِين',0],F:['فْلُور',0],Cl:['كْلُور',0],Br:['بْرُوم',0],I:['يُود',0],S:['كِبْرِيت',0],P:['فُوسْفُور',0],Si:['سِيلِيكُون',0],He:['هِيلِيُوم',0]};
 var METAL={H:1,Li:1,Na:1,K:1,Ag:1,NH4:1,Mg:1,Ca:1,Ba:1,Sr:1,Zn:1,Ni:1,Al:1,Fe:1,Cu:1,Hg:1,Pb:1,Sn:1,Mn:1,Cr:1,Co:1,Au:1};
 var VAR={Fe:1,Cu:1,Hg:1,Pb:1,Sn:1,Mn:1,Cr:1,Co:1,Au:1};
 /* radicals (anions): symbol -> [Arabic name, charge] */
 var RAD={SO4:['كِبْرِيتَات',2],SO3:['كِبْرِيتِيت',2],S2O3:['ثِيُوكِبْرِيتَات',2],S4O6:['تِتْرَاثِيُونَات',2],CO3:['كَرْبُونَات',2],HCO3:['بِيكَرْبُونَات',1],
  NO3:['نِتْرَات',1],NO2:['نِيتْرِيت',1],PO4:['فُوسْفَات',3],OH:['هَيْدْرُوكْسِيد',1],MnO4:['بَرْمَنْجَنَات',1],Cr2O7:['دَايْ كْرُومَات',2],CrO4:['كْرُومَات',2],
  CN:['سَيَانِيد',1],SCN:['ثِيُوسَيَانَات',1],ClO3:['كْلُورَات',1],ClO4:['بِيرْكْلُورَات',1],C2O4:['أُكْسَالَات',2],CH3COO:['أَسِيتَات',1],AlO2:['أَلُومِينَات',1],
  HSO4:['بِيكِبْرِيتَات',1],HSO3:['بِيكِبْرِيتِيت',1]};
 var BIN={Cl:['كْلُورِيد',1],Br:['بْرُومِيد',1],I:['يُودِيد',1],F:['فْلُورِيد',1],S:['كِبْرِيتِيد',2],O:['أُكْسِيد',2],N:['نِيتْرِيد',3]};
 var RADLIST=['CH3COO','Cr2O7','S4O6','S2O3','HCO3','HSO4','HSO3','MnO4','CrO4','ClO4','ClO3','C2O4','AlO2','SCN','SO4','SO3','CO3','NO3','NO2','PO4','NH4','OH','CN'];
 var DIATOMIC={H:1,O:1,N:1,F:1,Cl:1,Br:1,I:1};
 /* whole molecules / acids */
 var DICT={HCl:'حَمْض الهَيْدْرُوكْلُورِيك',H2SO4:'حَمْض الكِبْرِيتِيك',HNO3:'حَمْض النِّيتْرِيك',H3PO4:'حَمْض الفُوسْفُورِيك',H2CO3:'حَمْض الكَرْبُونِيك',
  HNO2:'حَمْض النِّيتْرُوز',H2SO3:'حَمْض الكِبْرِيتُوز',HBr:'حَمْض الهَيْدْرُوبْرُومِيك',HI:'حَمْض الهَيْدْرُويُودِيك',CH3COOH:'حَمْض الخَلِّيك',
  H2S:'كِبْرِيتِيد الهَيْدْرُوجِين',H2O:'المَاء',H2O2:'فَوْق أُكْسِيد الهَيْدْرُوجِين',NH3:'النُّشَادِر',CO2:'ثَانِي أُكْسِيد الكَرْبُون',SO2:'ثَانِي أُكْسِيد الكِبْرِيت',
  SO3:'ثَالِث أُكْسِيد الكِبْرِيت',NO2:'ثَانِي أُكْسِيد النِّيتْرُوجِين',NO:'أُكْسِيد النِّيتْرِيك',CO:'أَوَّل أُكْسِيد الكَرْبُون',Fe3O4:'أُكْسِيد الحَدِيد المَغْنَاطِيسِي'};
 var DICTG={HCl:'غَاز كْلُورِيد الهَيْدْرُوجِين',HBr:'غَاز بْرُومِيد الهَيْدْرُوجِين',HI:'غَاز يُودِيد الهَيْدْرُوجِين'};
 var NUMW={1:'وَاحِد',2:'اثْنَيْن',3:'ثَلَاثَة',4:'أَرْبَعَة',5:'خَمْسَة',6:'سِتَّة'};
 function al(b){var f=b.charAt(0);return SUN.indexOf(f)>-1?'ال'+f+'ّ'+b.slice(1):'الْ'+b}
 function spell(t){var o=[];for(var i=0;i<t.length;i++){var c=t.charAt(i);if(/[A-Za-z]/.test(c))o.push(LET[c.toUpperCase()]);else if(/\d/.test(c))o.push(DIG[+c])}return o.join(' ')}
 function nm(u){return ELEM[u.s]?ELEM[u.s][0]:RAD[u.s][0]}
 function parse(f){
  function seq(s){var out=[],i=0;
   while(i<s.length){var ch=s.charAt(i),u=null,m;
    if(ch==='('){var d=0,j=i;for(;j<s.length;j++){if(s.charAt(j)==='(')d++;else if(s.charAt(j)===')'){d--;if(!d)break}}
     if(d)return null;var inner=seq(s.slice(i+1,j));if(!inner||inner.length!==1)return null;u=inner[0];i=j+1;
     m=/^\d+/.exec(s.slice(i));if(m){u.n=+m[0];i+=m[0].length}out.push(u);continue}
    var hit=null;for(var k=0;k<RADLIST.length;k++){if(s.substr(i,RADLIST[k].length)===RADLIST[k]){hit=RADLIST[k];break}}
    if(hit){u={s:hit,n:1};i+=hit.length}
    else{var two=s.substr(i,2);if(/^[A-Z][a-z]$/.test(two)&&ELEM[two]){u={s:two,n:1};i+=2}else if(ELEM[ch]){u={s:ch,n:1};i++}else return null}
    m=/^\d+/.exec(s.slice(i));if(m){u.n=+m[0];i+=m[0].length}out.push(u)}
   return out}
  return seq(f)}
 function compound(us){
  if(us.length!==2)return null;var c=us[0],a=us[1];
  if(!METAL[c.s]&&METAL[a.s]){var tmp=c;c=a;a=tmp}
  if(c.s==='H'||!METAL[c.s])return null;var an=RAD[a.s]||BIN[a.s];if(!an)return null;
  var s=an[0]+' '+al(nm(c));
  if(VAR[c.s]){var ch=an[1]*a.n/c.n;if(ch>=1&&ch<=6&&ch%1===0)s+=' '+NUMW[ch]}
  return s}
 function ion(us,sign,digs){
  if(us.length!==1||us[0].n!==1)return null;var u=us[0],chg=digs?SUPS.indexOf(digs.charAt(0)):1;if(chg<1)chg=1;
  if(sign==='⁺'){if(!ELEM[u.s])return null;var s='أَيُون '+al(nm(u));if(VAR[u.s])s+=' '+NUMW[chg];return s}
  var an=RAD[u.s]||BIN[u.s];return an?'أَيُون '+al(an[0]):null}
 function stateWord(w,st){
  if(st==='g'&&!/^(غَاز|بُخَار)/.test(w))return w+' غَاز';
  if(st==='s')return w+' صُلْب';
  if(st==='v'&&!/^(غَاز|بُخَار)/.test(w))return 'بُخَار '+w;
  return w}
 function conv(raw){
  var t=raw.replace(/[\u2080-\u2089]/g,function(c){return String(c.charCodeAt(0)-8320)}),st='',m=/\((aq|g|s|l|v)\)$/.exec(t);
  if(m){st=m[1];t=t.slice(0,-m[0].length)}
  if(UNIT[t])return UNIT[t];
  if(ROMAN[t])return ROMAN[t];
  if(LABEL[t])return stateWord(LET[t],st);
  var cm=/^(.*?)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/.exec(t),us,r;
  if(cm){us=parse(cm[1]);r=us&&ion(us,cm[3],cm[2]);return r||spell(t)}
  var w=(st==='g'&&DICTG[t])||DICT[t];if(w)return stateWord(w,st);
  us=parse(t);
  if(us){
   if(us.length===1&&us[0].n===1&&ELEM[us[0].s])return stateWord(ELEM[us[0].s][0],st);
   if(us.length===1&&us[0].n===2&&DIATOMIC[us[0].s]){var b=al(ELEM[us[0].s][0]);return st==='v'?'بُخَار '+b:(st==='g'||/^(H|O|N|F|Cl)$/.test(us[0].s))?'غَاز '+b:b}
   r=compound(us);if(r)return stateWord(r,st);
   return us.map(function(u){return nm(u)+(u.n>1?' '+DIG[u.n%10]:'')}).join(' ')}
  return spell(t)}
 function trim(t){var pre='',post='';
  while(t.charAt(0)==='('){var d=0,ok=false;for(var i=0;i<t.length;i++){if(t.charAt(i)==='(')d++;else if(t.charAt(i)===')'){d--;if(!d){ok=(i===t.length-1?'all':true);break}}}
   if(ok==='all'){pre+='(';post=')'+post;t=t.slice(1,-1);continue}if(ok)break;pre+='(';t=t.slice(1)}
  while(t.slice(-1)===')'){var o=(t.match(/\(/g)||[]).length,c=(t.match(/\)/g)||[]).length;if(c>o){post=')'+post;t=t.slice(0,-1)}else break}
  return [pre,t,post]}
 /* diacritics for common words (key = word without marks; optional prefixes و ف ب ل ك ال handled) */
 var WORDS=('مَحْلُول مَحَالِيل مَحْلُولَيْ رَاسِب رَاسِبًا رَاسِبَيْن رَوَاسِب مِلْح أَمْلَاح مِلْحَيْن حَمْض حَمْضِيّ مُحَمَّضَة قِلْوِيّ غَاز غَازَيْن كَاشِف مُخَفَّف مُرَكَّز عَدِيم لَوْن لَوْنُه '+
 'أَبْيَض أَسْوَد أَصْفَر أَحْمَر حَمْرَاء بُنِّيّ مُحْمَرّ جِيلَاتِينِيّ تَصَاعَدَ تَصَاعَدَت يَتَصَاعَد يَذُوب يَتَكَوَّن يَكُون يَزُول يَتَحَوَّل يُحَوِّل يَسْوَدّ يَصْفَرّ يَزْرَقّ يَخْضَرّ يَخْتَفِي يَحْدُث '+
 'يُعَبِّر تُعَبِّر يُسْتَخْدَم مُسْتَخْدَم يُمْكِن يُعَدّ تَسَبَّبَ أُضِيفَ أُضِيفَت أُذِيبَ أُذِيبَت تَمَّ تَمَّت تَرَسَّبَ إِضَافَة إِضَافَتِهَا إِلَيْهَا إِلَيْه إِمْرَار تَسْخِين تَرْشِيح فَصْل عِلْمًا حَالَة عِنْد '+
 'هُمَا مِنْهُمَا أَحَدُهُمَا آخَر مَا عَدَا تَرْكِيز تَرْكِيزُه كُتْلَة كُتْلَتُه كُتْلَتُهَا حَجْم ضِعْف نِسْبَة مِئَوِيَّة مُولِيَّة نَقِيّ نَقِيَّة عَيِّنَة مَخْلُوط كِيمْيَائِيَّة وَفْرَة تُسَاوِي مُبَلَّلَة وَرَقَة نَشَا '+
 'أَبْخِرَة فُوَّهَة أُنْبُوبَة صُلْبَة صُلْب سَاخِن بَارِد مُشَاهَدَات تَجْرِبَة كَشْف تَمْيِيز مُؤَكْسِد عَامِل أَكْسَدَة قَابِل قَوِيّ مَعْدِنِيّ اصْفِرَار رَائِحَة نُشَادِر تَرْتِيب آتِيَة تَالِيَة سَابِقَة لَازِمَة '+
 'نَتَائِج نَاتِج مُرَكَّبَات أَزْوَاج فَتْرَة نَفْس نِصْف مُخْتَلِف مُخْتَلِفَيْن بِسُرْعَة بِبُطْء بِوَاسِطَة مُعَايَرَة مُعَادَلَة اخْتِزَال ثَانِي ثَلَاثَة هَيْدْرُوكْلُورِيك كِبْرِيتِيك نِيتْرِيك').split(' ');
 var DW={};
 function strip(s){return s.replace(/[\u064B-\u065F\u0670]/g,'')}
 WORDS.forEach(function(w){if(w)DW[strip(w)]=w});
 [ELEM,RAD,BIN].forEach(function(T){for(var k in T){var b=T[k][0];if(b.indexOf(' ')<0)DW[strip(b)]=b}});
 var PREF=[['وبال','وَبِال'],['فبال','فَبِال'],['ولل','وَلِل'],['وال','وَال'],['فال','فَال'],['بال','بِال'],['كال','كَال'],['لل','لِل'],['وب','وَبِ'],['ول','وَلِ'],['فب','فَبِ'],['ال','ال'],['و','وَ'],['ف','فَ'],['ب','بِ'],['ل','لِ'],['ك','كَ'],['','']];
 function dia(text){return text.replace(/[\u0621-\u064A]+/g,function(w){
  if(DW[w])return DW[w];
  for(var i=0;i<PREF.length;i++){var p=PREF[i][0];if(p&&w.indexOf(p)===0&&w.length>p.length&&DW[w.slice(p.length)])return PREF[i][1]+DW[w.slice(p.length)]}
  return w})}
 function clean(s,raw){
  s=String(s==null?'':s);var store=[];
  s=s.replace(/\(*[A-Z][A-Za-z0-9\u2070-\u209F\u00B2\u00B3\u00B9()]*/g,function(m){var p=trim(m);store.push(conv(p[1]));return p[0]+'\uE000'+(store.length-1)+'\uE001'+p[2]});
  s=s.replace(/[A-Za-z]+/g,function(w){return ' '+(UNIT[w]||spell(w))+' '});
  if(!raw)s=dia(s);
  s=s.replace(/\uE000(\d+)\uE001/g,function(_,i){return ' '+store[+i]+' '});
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g,'').replace(/→/g,' يُعْطِي ').replace(/←/g,' مِنْ ').replace(/[–—]/g,' ، ').replace(/%/g,' فِي المِيَّة ').replace(/\s\+\s/g,' زَائِد ')
   .replace(/\.{3,}|…+/g,' ، ').replace(/[()\[\]]/g,' ').replace(/\s*[:,،]\s*/g,' ، ').replace(/\s+/g,' ').replace(/^(\s*،)+|(\s*،)+\s*$/g,'').trim()}
 return {clean:clean,conv:conv};
})();
/* ---- listen to the question (browser text-to-speech, prefers a female Arabic voice) ---- */
var TTS=!!(window.speechSynthesis&&window.SpeechSynthesisUtterance),speakingId=null,ttsUtter=null;
function pickVoice(){
 var vs=[];try{vs=window.speechSynthesis.getVoices()||[]}catch(e){}
 var ar=vs.filter(function(v){return /^ar/i.test(v.lang||'')||/arab|عرب/i.test(v.name||'')});
 if(!ar.length)return null;
 var fem=/hoda|salma|zariyah|laila|leila|noura|amira|fatima|sara|hala|mariam|maryam|female|google.*عرب|هدى|سلمى/i,
     male=/naayf|maged|tarik|hamed|shakir|fahed|zied|\bmale\b|رجل/i;
 function score(v){var n=v.name||'',sc=0;if(/^ar[-_]EG/i.test(v.lang||''))sc+=3;if(fem.test(n))sc+=4;if(male.test(n))sc-=10;return sc}
 ar.sort(function(a,b){return score(b)-score(a)});return ar[0];
}
function buildSpeech(q){
 /* optional manual overrides per question: q.speech (stem) and q.optionsSpeech (array, same order as q.options) */
 var t=(typeof q.speech==='string'&&q.speech.trim())?SP.clean(q.speech,true):SP.clean(q.text),ord=['الأَوَّل','الثَّانِي','الثَّالِث','الرَّابِع','الخَامِس','السَّادِس'],os=Array.isArray(q.optionsSpeech)?q.optionsSpeech:[];
 function opt(o){return os[o]?SP.clean(os[o],true):SP.clean(q.options[o])}
 if(q.type==='mcq'){
  var order=active.optionOrders[q.id]||q.options.map(function(_,i){return i});
  t+=' . الاِخْتِيَارَات: '+order.map(function(o,i){return (ord[i]||('رَقْم '+(i+1)))+' ، '+opt(o)}).join(' . ');
 }else if(q.type==='truefalse'){t+=' . صَحّ أَوْ غَلَط؟'}
 return t;
}
function markListen(on){var b=$('[data-listen]');if(!b)return;b.classList.toggle('speaking',!!on);b.setAttribute('aria-pressed',on?'true':'false');var t=b.querySelector('.exam-listen-t');if(t)t.textContent=on?'إيقاف':'استماع'}
var speechRun=0,speechTimer=null;
function stopSpeech(){speechRun++;clearTimeout(speechTimer);speakingId=null;ttsUtter=null;try{window.speechSynthesis.cancel()}catch(e){}markListen(false)}
function listenBtn(){return TTS?'<button type="button" class="exam-listen" data-listen aria-pressed="false" title="استماع للسؤال"><span class="exam-listen-t">استماع</span></button>':''}
function numAr(n){
 var U=['','وَاحِد','اثْنَيْن','ثَلَاثَة','أَرْبَعَة','خَمْسَة','سِتَّة','سَبْعَة','ثَمَانِيَة','تِسْعَة','عَشَرَة','أَحَدَ عَشَر','اثْنَا عَشَر','ثَلَاثَةَ عَشَر','أَرْبَعَةَ عَشَر','خَمْسَةَ عَشَر','سِتَّةَ عَشَر','سَبْعَةَ عَشَر','ثَمَانِيَةَ عَشَر','تِسْعَةَ عَشَر'],
     T=['','','عِشْرِين','ثَلَاثِين','أَرْبَعِين','خَمْسِين','سِتِّين','سَبْعِين','ثَمَانِين','تِسْعِين'];
 if(n<20)return U[n];var t=Math.floor(n/10),u=n%10;return u?U[u]+' وَ'+T[t]:T[t];
}
function yearAr(d){var n=parseInt(d,10);if(d.length===4&&n>=2000&&n<=2099){var r=n-2000;return 'أَلْفَيْن'+(r?' وَ'+numAr(r):'')}if(d.length===2)return 'أَلْفَيْن'+(n?' وَ'+numAr(n):'');return d}
/* "تجريبي 23" -> "السؤال ده جه في امتحان تجريبي سنة ألفين وتلاتة وعشرين" */
function yearLine(label){
 var s=String(label||'').trim();if(!s)return '';
 var m=/(\d{4}|\d{2})\s*$/.exec(s),yr='',rest=s;
 if(m){yr=yearAr(m[1]);rest=s.slice(0,m.index).trim()}
 rest=rest.replace(/(^|\s)ثان(?=\s|$)/g,'$1الدَّوْر الثَّانِي').replace(/(^|\s)أول(?=\s|$)/g,'$1الدَّوْر الأَوَّل').replace(/تجريبي/g,'تَجْرِيبِي').replace(/مصر/g,'مِصْر');
 return 'السُّؤَال ده جَه فِي '+(/^امتحان/.test(rest)?'':'امْتِحَان ')+rest+(yr?' سَنَة '+yr:'');
}
function ordinalAr(n){
 var U=['','الأَوَّل','الثَّانِي','الثَّالِث','الرَّابِع','الخَامِس','السَّادِس','السَّابِع','الثَّامِن','التَّاسِع','العَاشِر'],
     C=['','الحَادِي','الثَّانِي','الثَّالِث','الرَّابِع','الخَامِس','السَّادِس','السَّابِع','الثَّامِن','التَّاسِع'],
     T=['','','العِشْرُون','الثَّلَاثُون','الأَرْبَعُون','الخَمْسُون','السِّتُّون','السَّبْعُون','الثَّمَانُون','التِّسْعُون'];
 if(n>=1&&n<=10)return U[n];
 if(n>=11&&n<=19)return C[n-10]+' عَشَر';
 if(n>=20&&n<=99){var t=Math.floor(n/10),u=n%10;return u?C[u]+' وَ'+T[t]:T[t]}
 return 'رَقْم '+n;
}
function speakQuestion(){
 var q=currentQuestion(),ex=currentExam();if(!q||!TTS)return;
 if(speakingId===q.id){stopSpeech();return}
 try{window.speechSynthesis.cancel()}catch(e){}
 clearTimeout(speechTimer);
 var v=pickVoice(),run=++speechRun;
 function mk(text){var x=new SpeechSynthesisUtterance(text);x.lang=v?v.lang:'ar-EG';if(v)x.voice=v;x.rate=.92;x.pitch=1.15;return x}
 /* 1) question number  2) pause + where it came from (year)  3) pause + the question itself */
 var parts=[{t:'السُّؤَال '+ordinalAr(active.index+1),gap:0}];
 if(ex&&ex.showYear&&q.year){var yl=yearLine(q.year);if(yl)parts.push({t:yl,gap:700})}
 parts.push({t:buildSpeech(q),gap:700});
 var i=0;
 function next(){
  if(run!==speechRun)return;
  var p=parts[i++];
  if(!p){speakingId=null;ttsUtter=null;markListen(false);return}
  var u=mk(p.t);ttsUtter=u;
  u.onend=u.onerror=function(){if(run!==speechRun)return;speechTimer=setTimeout(next,parts[i]?parts[i].gap:0)};
  try{window.speechSynthesis.speak(u)}catch(e){stopSpeech()}
 }
 speakingId=q.id;markListen(true);
 if(!v)toast('مفيش صوت عربي على الجهاز ده، هيتقرأ بالصوت الافتراضي.');
 next();
}
function renderAttempt(){
 var e=currentExam();if(!e||!active)return;
 var q=currentQuestion();if(!q){submitExam(true);return}
 if(speakingId&&speakingId!==q.id)stopSpeech();
 document.body.classList.add('exam-active');
 var progress=Math.round((active.index+1)/active.order.length*100);
 var nav=active.order.map(function(id,i){var qq=e.questions.find(function(x){return x.id===id});return'<button type="button" class="exam-nav-dot '+(i===active.index?'current ':'')+(qq&&answered(qq)?'answered':'')+'" data-jump="'+i+'">'+(i+1)+'</button>'}).join('');
 var pic=safeUrl(q.image);
 ROOT.innerHTML='<section class="exam-live exam-theme-'+themeOf(e)+'">'+
 '<header class="exam-live-head"><div><span class="exam-live-kicker">'+esc(e.title)+'</span><h2>السؤال '+(active.index+1)+' من '+active.order.length+'</h2></div><div class="exam-clock" id="exam-clock">'+formatTime(active.endAt-Date.now())+'</div></header>'+
 '<div class="exam-progress"><i style="width:'+progress+'%"></i></div>'+
 '<div class="exam-live-layout"><aside class="exam-side"><b>التنقل بين الأسئلة</b><div class="exam-nav">'+nav+'</div><p>تمت الإجابة عن '+active.order.filter(function(id){var z=e.questions.find(function(x){return x.id===id});return z&&answered(z)}).length+' من '+active.order.length+'</p><button type="button" class="btn exam-submit-side" data-submit>تسليم الامتحان</button></aside>'+
 '<main class="exam-question '+(q.displayStyle==='highlight'?'highlight':q.displayStyle==='compact'?'compact':'')+'"><div class="exam-question-meta"><span>السؤال '+(active.index+1)+'</span>'+(e.showYear&&q.year?'<span class="exam-year">'+esc(q.year)+'</span>':'')+'<span>'+Math.max(0,+q.points||1)+' درجة</span>'+listenBtn()+'</div><h3>'+nl(q.text)+'</h3>'+(pic?'<img class="exam-question-image" src="'+esc(pic)+'" alt="'+esc(q.imageAlt||'صورة السؤال')+'">':'')+
 '<div class="exam-answer-area">'+renderAnswer(q)+'</div>'+
 '<div class="exam-question-actions"><button type="button" class="btn alt" data-prev '+(active.index===0?'disabled':'')+'>السابق</button><button type="button" class="btn" data-next>'+(active.index===active.order.length-1?'مراجعة وتسليم':'السؤال التالي')+'</button></div></main></div></section>';
 startClock();markListen(speakingId===q.id);
}
function formatTime(ms){var s=Math.max(0,Math.floor(ms/1000)),m=Math.floor(s/60),r=s%60;return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')}
function startClock(){clearInterval(timer);tick();timer=setInterval(tick,1000)}
function tick(){if(!active)return;var left=active.endAt-Date.now(),el=$('#exam-clock');if(el)el.textContent=formatTime(left);if(left<=0){clearInterval(timer);submitExam(true)}}
function storeCurrentAnswer(){var q=currentQuestion();if(!q)return;
 if(q.type==='mcq'){var x=$('input[name="exam-answer"]:checked');if(x)active.answers[q.id]=+x.value}
 else if(q.type==='truefalse'){var x=$('input[name="exam-answer"]:checked');if(x)active.answers[q.id]=x.value==='true'}
 else if(q.type==='short'||q.type==='fill'){var x=$('#exam-text-answer');if(x)active.answers[q.id]=x.value}
 else if(q.type==='matching'){var a=active.answers[q.id]||{};$$('[data-match]').forEach(function(s){if(s.value==='')delete a[s.dataset.match];else a[s.dataset.match]=+s.value});active.answers[q.id]=a}
 save();
}
function norm(s){return String(s==null?'':s).trim().toLocaleLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/\s+/g,' ')}
function grade(q,a){var p=Math.max(0,+q.points||1),earned=0,correct=false,expected='';
 if(q.type==='mcq'){correct=Number(a)===Number(q.answer);earned=correct?p:0;expected=q.options[q.answer]}
 else if(q.type==='truefalse'){correct=typeof a==='boolean'&&a===!!q.answer;earned=correct?p:0;expected=q.answer?'صح':'غلط'}
 else if(q.type==='short'||q.type==='fill'){var accepted=q.acceptedAnswers||[];correct=typeof a==='string'&&accepted.some(function(x){return norm(x)===norm(a)});earned=correct?p:0;expected=accepted.join(' / ')}
 else if(q.type==='matching'){var right=0,total=q.pairs.length;q.pairs.forEach(function(pair,i){if(a&&Number(a[i])===i)right++});earned=total?p*right/total:0;correct=right===total;expected=q.pairs.map(function(x){return x.left+' ← '+x.right}).join('، ')}
 else if(q.type==='ordering'){var list=Array.isArray(a)?a:[];correct=list.length===q.items.length&&list.every(function(x,i){return Number(x)===i});earned=correct?p:0;expected=q.items.join(' ← ')}
 return{correct:correct,earned:earned,points:p,expected:expected,answer:a,explanation:q.explanation||''};
}
function answerText(q,a){if(a===undefined||a===null)return'لم تتم الإجابة';if(q.type==='mcq')return q.options[Number(a)]||'—';if(q.type==='truefalse')return a?'صح':'غلط';if(q.type==='short'||q.type==='fill')return String(a)||'لم تتم الإجابة';if(q.type==='matching')return q.pairs.map(function(p,i){return p.left+' ← '+(a&&a[i]!==undefined?q.pairs[Number(a[i])].right:'—')}).join('، ');if(q.type==='ordering')return(Array.isArray(a)?a:[]).map(function(i){return q.items[Number(i)]}).join(' ← ')||'لم تتم الإجابة';return'—'}
function submitExam(auto){if(!active)return;stopSpeech();storeCurrentAnswer();var e=currentExam();if(!e)return;
 if(!auto&&!confirm('تأكيد تسليم الامتحان؟ لن تتمكني من تعديل الإجابات بعد التسليم.'))return;
 var total=0,earned=0,details=[];
 e.questions.forEach(function(q){var g=grade(q,active.answers[q.id]);total+=g.points;earned+=g.earned;details.push({questionId:q.id,correct:g.correct,earned:g.earned,points:g.points,expected:g.expected,answer:answerText(q,active.answers[q.id]),explanation:g.explanation})});
 var percent=total?Math.round(earned/total*100):0,result={examId:e.id,completedAt:Date.now(),earned:Number(earned.toFixed(2)),total:Number(total.toFixed(2)),percent:percent,passed:percent>=Math.max(0,+e.passMark||0),details:details,autoSubmitted:!!auto};
 var all=results();all.push(result);write(STORE.results,all);active=null;remove(STORE.active);clearInterval(timer);document.body.classList.remove('exam-active');renderResult(e,result);
}
function renderResult(e,r){var h='<section class="exam-result exam-theme-'+themeOf(e)+'"><div class="exam-result-mark '+(r.passed?'pass':'fail')+'">'+(r.passed?'أحسنتِ!':'انتهى الامتحان')+'</div><h2>'+esc(e.title)+'</h2><div class="exam-score">'+r.percent+'<small>%</small></div><p>درجتك '+r.earned+' من '+r.total+' · '+(r.passed?'حققْتِ درجة النجاح':'راجعي الإجابات وحاولي مرة تانية')+'</p>'+(r.autoSubmitted?'<p class="exam-help">تم التسليم تلقائيًا لانتهاء الوقت.</p>':'');
 if(e.showAnswers){h+='<div class="exam-review"><h3>مراجعة الإجابات</h3>'+e.questions.map(function(q){var d=r.details.find(function(x){return x.questionId===q.id});return'<article class="exam-review-item"><b class="'+(d&&d.correct?'review-ok':'review-no')+'">'+(d&&d.correct?'إجابة صحيحة':'تحتاج مراجعة')+' · '+nl(q.text)+(e.showYear&&q.year?' <span class="exam-year">'+esc(q.year)+'</span>':'')+'</b><p>إجابتك: '+esc(d?d.answer:'—')+'</p><p>الإجابة الصحيحة: '+esc(d?d.expected:'—')+'</p>'+(d&&d.explanation?'<small>'+nl(d.explanation)+'</small>':'')+'</article>'}).join('')+'</div>'}
 h+='<div class="exam-result-actions"><button class="btn" id="exam-back-cards">العودة للامتحانات</button>'+(e.allowRetry?'<button class="btn alt" id="exam-retry">إعادة الامتحان</button>':'')+'</div></section>';
 ROOT.innerHTML=h;$('#exam-back-cards').onclick=renderCards;if($('#exam-retry'))$('#exam-retry').onclick=function(){startExam(e.id)};
}
ROOT.addEventListener('click',function(ev){
 var start=ev.target.closest('[data-start]');if(start){startExam(start.dataset.start);return}
 if(!active)return;
 if(ev.target.closest('[data-listen]')){speakQuestion();return}
 var jump=ev.target.closest('[data-jump]');if(jump){storeCurrentAnswer();active.index=+jump.dataset.jump;save();renderAttempt();return}
 var move=ev.target.closest('[data-move]');if(move){storeCurrentAnswer();var q=currentQuestion(),a=active.answers[q.id]||(active.orderingOrders[q.id]||shuffle(q.items.map(function(_,i){return i}))).slice(),pos=+move.dataset.pos,to=move.dataset.move==='up'?pos-1:pos+1;if(to>=0&&to<a.length){var t=a[pos];a[pos]=a[to];a[to]=t;active.answers[q.id]=a;save();renderAttempt()}return}
 if(ev.target.closest('[data-submit]')){submitExam(false);return}
 if(ev.target.closest('[data-next]')){storeCurrentAnswer();if(active.index===active.order.length-1){if(confirm('وصلتِ لآخر سؤال. هل تريدين تسليم الامتحان؟'))submitExam(false)}else{active.index++;save();renderAttempt()}return}
 if(ev.target.closest('[data-prev]')){storeCurrentAnswer();active.index=Math.max(0,active.index-1);save();renderAttempt();return}
});
ROOT.addEventListener('change',function(ev){if(!active)return;if(ev.target.matches('input[name="exam-answer"],select[data-match]')){storeCurrentAnswer();renderAttempt()}});
ROOT.addEventListener('input',function(ev){if(active&&ev.target.id==='exam-text-answer')storeCurrentAnswer()});
document.addEventListener('click',function(ev){var b=ev.target.closest('#pages [data-p="exam"]');if(b){renderCards();var a=read(STORE.active,null);if(a&&examById(a.examId)){resumeAttempt(a)}}});
document.addEventListener('click',function(ev){if(active){var nav=ev.target.closest('#pages [data-p], [data-go]');if(nav){ev.preventDefault();ev.stopImmediatePropagation();toast('لا يمكن مغادرة الامتحان قبل تسليمه.')}}},true);
window.addEventListener('beforeunload',function(ev){if(active){ev.preventDefault();ev.returnValue='الامتحان لم يتم تسليمه بعد.';return ev.returnValue}});
window.addEventListener('popstate',function(){if(active){pinExamHistory();toast('كمّلي الامتحان قبل الرجوع.')}});
window.addEventListener('hashchange',function(){if(active&&location.hash!=='#exam'){try{history.replaceState({etoExamLock:true},'','#exam')}catch(e){}focusExamPage();toast('كمّلي الامتحان قبل مغادرة الصفحة.')}});
window.addEventListener('storage',function(ev){if(ev.key==='eto_exam_results_v1')renderCards()});
renderCards();
var saved=read(STORE.active,null);if(saved&&examById(saved.examId)){var tab=$('#pages [data-p="exam"]');if(tab)tab.click();else resumeAttempt(saved)}
})();