(function(){
'use strict';
if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return;
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

/* ================= Lecture auto-reader =================
   Reads every explanation step aloud on each click. The speaker button in the bottom bar (or the V key)
   turns it on / off, and the choice is remembered. */
var KEY='lec_read_v1';
function getOn(){try{return localStorage.getItem(KEY)!=='0'}catch(e){return true}}
function saveOn(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}}
var on=getOn(),run=0,timer=null,curUtter=null;

function pickVoice(){
 var vs=[];try{vs=window.speechSynthesis.getVoices()||[]}catch(e){}
 var ar=vs.filter(function(v){return /^ar/i.test(v.lang||'')||/arab|عرب/i.test(v.name||'')});
 if(!ar.length)return null;
 var fem=/hoda|salma|zariyah|laila|leila|noura|amira|fatima|sara|hala|mariam|maryam|female|google.*عرب|هدى|سلمى/i,
     male=/naayf|maged|tarik|hamed|shakir|fahed|zied|\bmale\b|رجل/i;
 function score(v){var n=v.name||'',sc=0;if(/^ar[-_]EG/i.test(v.lang||''))sc+=3;if(fem.test(n))sc+=4;if(male.test(n))sc-=10;return sc}
 ar.sort(function(a,b){return score(b)-score(a)});return ar[0];
}

var SUPM={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
var NUMW=['','وَاحِد','اِتْنِين','تَلَاتَة','أَرْبَعَة','خَمْسَة','سِتَّة','سَبْعَة','تَمَانْيَة','تِسْعَة'];
var BLOCK={DIV:1,P:1,LI:1,TR:1,BR:1,H1:1,H2:1,H3:1,BUTTON:1,SECTION:1,TABLE:1,UL:1};
var ROOT=null;

function skipEl(el){
 var cl=el.classList;
 if(cl.contains('eflow')||cl.contains('swatch')||cl.contains('hint')||cl.contains('meter')||cl.contains('hud')||cl.contains('menu')||cl.contains('prog')||cl.contains('badge'))return true;
 if(cl.contains('go')&&el.closest('.cover'))return true;
 if(el.id&&/^sc\d+$/.test(el.id))return true;
 if(el.hidden)return true;
 if(cl.contains('expl')){try{if(getComputedStyle(el).display==='none')return true}catch(e){}}
 if(cl.contains('st')&&!cl.contains('on')&&el!==ROOT)return true;
 return false;
}
function walk(node,out){
 if(node.nodeType===3){out.push(node.nodeValue);return}
 if(node.nodeType!==1)return;
 var tag=node.tagName.toUpperCase();
 if(tag==='SVG'||tag==='SCRIPT'||tag==='STYLE'||tag==='SMALL')return;
 if(skipEl(node))return;

 if(tag==='TABLE'){out.push(' . '+tableSpeech(node)+' . ');return}
 if(tag==='SUP'){
  var t=node.textContent.replace(/\s/g,''),m=/^([+\-\u2212])(\d+(?:\.\d+)?)$/.exec(t);
  if(m){out.push(' '+(m[1]==='+'?'زَائِد':'نَاقِص')+' '+m[2]+' ');return}
  if(/^\d*[+\-\u2212]$/.test(t)){out.push(t.replace(/\d/g,function(d){return SUPM[d]}).replace('+','⁺').replace(/[\-\u2212]/,'⁻'));return}
  out.push(' أُس '+t+' ');return;
 }
 if((tag==='TD')&&node.dataset&&node.dataset.l&&node.previousElementSibling)out.push(' '+node.dataset.l+' ، ');
 for(var c=node.firstChild;c;c=c.nextSibling)walk(c,out);
 if(tag==='TD'||tag==='TH')out.push(' ، ');
 else if(BLOCK[tag])out.push(' . ');
}
function cellText(c){var o=[];for(var n=c.firstChild;n;n=n.nextSibling)walk(n,o);return o.join('').replace(/\s+/g,' ').replace(/(\s*[.،]\s*)+$/,'').trim()}
function hdrOf(t){
 var r0=t.rows&&t.rows[0];
 if(r0&&r0.cells.length>1&&[].every.call(r0.cells,function(c){return c.tagName==='TH'}))return [].map.call(r0.cells,cellText);
 return null;
}
function introOf(hdr){var names=hdr.filter(Boolean);return names.length>1?'دِي مُقَارَنَة بَيْن '+names.join(' و '):'جَدْوَل '+names.join(' ')}
function rowSpeech(r,hdr){
 var tx=[].map.call(r.cells,cellText);
 if(!hdr)return tx.filter(Boolean).join(' ، ');
 var lab='',j0=0,parts=[];
 if(!hdr[0]&&tx.length>1){lab=tx[0];j0=1}
 tx.forEach(function(c,j){if(j<j0||!c)return;parts.push((hdr[j]?hdr[j]+' ، ':'')+c)});
 return (lab?lab+' ، ':'')+parts.join(' . ');
}
function tableSpeech(t){
 var rows=[].slice.call(t.rows||[]);if(!rows.length)return '';
 var hdr=hdrOf(t),out=[];
 if(hdr){rows.shift();out.push(introOf(hdr))}else out.push('جَدْوَل');
 rows.forEach(function(r){out.push(rowSpeech(r,hdr))});
 return out.join(' . ');
}
function prep(s){
 s=s.replace(/\u00a0/g,' ')
  .replace(/Dr\.?\s*\/?\s*Mohammed/gi,' دُكْتُور مُحَمَّد ')
  .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u2B50★✦]/gu,' ')
  .replace(/\((aq|g|s|l|v)\)/g,' ')
  .replace(/\(conc\)/gi,' مُرَكَّز ')
  .replace(/—\s*Δ\s*→|-Δ->|Δ\s*→/g,' بِالتَّسْخِين يُعْطِي ')
  .replace(/—\s*water\s*→/gi,' فِي المَاء يُعْطِي ')
  .replace(/—\s*([A-Za-z0-9()]+)\s*→/g,' $1 يُعْطِي ')
  .replace(/Δ/g,' تَسْخِين ')
  .replace(/↑/g,' غَاز ').replace(/↓/g,' رَاسِب ')
  .replace(/½/g,' نُصّ ')
  .replace(/⇌/g,' فِي اتِّزَان مَعَ ')
  .replace(/×/g,' ضَرْب ')
  .replace(/>/g,' أَكْبَر مِنْ ')
  .replace(/=/g,' يُسَاوِي ')
  .replace(/(\d)\s*\/\s*(\d)/g,'$1 مِنْ $2')
  .replace(/[|\/]/g,' ، ')
  .replace(/اضغط\s*M.*$/,'')
  .replace(/(^|[\s:(،])\+(\d)/g,'$1 زَائِد $2')
  .replace(/(^|[\s:(،])[\-\u2212](\d)/g,'$1 نَاقِص $2')
  .replace(/(^|[\s+→(،:])(\d)(?=\(?[A-Z])/g,function(_,a,d){return a+' '+NUMW[+d]+' '});
 return s;
}
function finish(parts){
 var s=parts.join('').replace(/\s+/g,' ').trim();
 if(!s)return '';
 try{s=SP.clean(prep(s))}catch(e){s=prep(s)}
 return s.replace(/\s*[.،]\s*(?:[.،]\s*)+/g,' ، ').replace(/\s+/g,' ').trim();
}
function textOf(el,mode){
 var out=[];ROOT=el;
 if(el.tagName==='TR'&&el.closest('table')){
  var tb=el.closest('table'),hd=hdrOf(tb),first=tb.querySelector('tr.st')===el;
  return finish([(hd&&first?introOf(hd)+' . ':'')+rowSpeech(el,hd)]);
 }
 if(el.classList.contains('flipc')){
  var f=el.querySelector(mode==='back'?'.fb':'.fa');if(f){ROOT=f;walk(f,out)}
 }else walk(el,out);
 return finish(out);
}
function slideText(s){
 if(s.querySelector('.st')){var h=s.querySelector('.sh h2');return h?textOf(h):''}
 return textOf(s);
}
function chunks(t){
 var parts=t.split(/\s*،\s*|\.\s+/).filter(Boolean),out=[],cur='';
 parts.forEach(function(p){
  p=p.replace(/\.$/,'');
  if(cur&&(cur.length+p.length)>85){out.push(cur);cur=p}else cur=cur?cur+' ، '+p:p;
 });
 if(cur)out.push(cur);return out;
}
function stop(){run++;clearTimeout(timer);curUtter=null;try{window.speechSynthesis.cancel()}catch(e){}}
function speak(text){
 stop();
 if(!on||!text)return;
 var my=++run;
 timer=setTimeout(function(){
  if(my!==run)return;
  var list=chunks(text),v=pickVoice(),i=0;
  (function next(){
   if(my!==run||i>=list.length)return;
   var u=new SpeechSynthesisUtterance(list[i++]);
   u.lang=v?v.lang:'ar-EG';if(v)u.voice=v;u.rate=.8;u.pitch=1;
   var done=false,go=function(){if(done)return;done=true;clearTimeout(wd);if(my===run)next()};
   var wd=setTimeout(function(){if(done||my!==run)return;try{window.speechSynthesis.cancel()}catch(e){}setTimeout(go,60)},Math.max(4000,u.text.length*180+2500));
   u.onend=u.onerror=go;
   curUtter=u;
   try{window.speechSynthesis.speak(u)}catch(e){}
  })();
 },40);
}

/* ---- watch the lecture engine: every click that reveals something is spotted here ---- */
function hasTok(str,tok){return (' '+(str||'')+' ').indexOf(' '+tok+' ')>-1}
var obs=new MutationObserver(function(recs){
 var act=null,stopped=false;
 recs.forEach(function(r){
  var t=r.target;
  if(t.nodeType!==1||t.closest('#pdf-export-host')||document.getElementById('pdfcover'))return;
  var cl=t.classList,old=r.oldValue||'';
  if(r.attributeName==='class'){
   if(cl.contains('slide')&&cl.contains('active')&&!hasTok(old,'active'))act={k:'slide',el:t};
   else if(cl.contains('st')&&cl.contains('on')&&!hasTok(old,'on')){if(/animate__/.test(t.className))act={k:'step',el:t}}
   else if(cl.contains('flipc')&&cl.contains('flipped')&&!hasTok(old,'flipped'))act={k:'flip',el:t};
   else if(cl.contains('st')&&!cl.contains('on')&&hasTok(old,'on'))stopped=true;
  }
  if(cl.contains('expl')){
   var shown=false;try{shown=getComputedStyle(t).display!=='none'}catch(e){}
   if(shown&&!t._rd){t._rd=1;act={k:'expl',el:t}}else if(!shown)t._rd=0;
  }
 });
 if(!act){if(stopped)stop();return}
 if(act.k==='slide'){
  var sts=act.el.querySelectorAll('.st');
  if(sts.length&&[].every.call(sts,function(e){return e.classList.contains('on')})){stop();return}
  speak(slideText(act.el));
 }else if(act.k==='step')speak(textOf(act.el));
 else if(act.k==='flip')speak(textOf(act.el,'back'));
 else if(act.k==='expl')speak(textOf(act.el));
});
obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style'],attributeOldValue:true});

/* ---- on/off button in the bottom bar ---- */
var btn=document.createElement('button');
btn.type='button';btn.id='bRead';
function paint(){
 var ic='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/>'+
  (on?'<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>':'<path d="M22 9l-6 6M16 9l6 6"/>')+'</svg>';
 btn.innerHTML=ic;
 btn.setAttribute('aria-pressed',on?'true':'false');
 btn.setAttribute('aria-label',on?'إيقاف القراءة التلقائية':'تشغيل القراءة التلقائية');
 btn.title=on?'إيقاف القراءة التلقائية (V)':'تشغيل القراءة التلقائية (V)';
 btn.style.opacity=on?'1':'.6';btn.style.borderColor=on?'rgba(25,211,189,.7)':'';
}
function toggle(){
 on=!on;saveOn(on);paint();
 if(!on){stop();return}
 var s=document.querySelector('.slide.active');if(s)speak(slideText(s));
}
paint();
btn.addEventListener('click',function(e){e.stopPropagation();toggle()});
var st=document.createElement('style');
st.textContent='#bRead{flex:none;min-width:40px;padding-left:10px!important;padding-right:10px!important}#bRead svg{width:20px;height:20px}@media (max-width:760px){#bRead{flex:1!important}}#hud .btns{flex-wrap:nowrap}';
document.head.appendChild(st);
var bar=document.querySelector('#hud .btns');
if(bar)bar.insertBefore(btn,document.getElementById('bPDF')||null);
document.addEventListener('keydown',function(e){
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.target&&e.target.closest&&e.target.closest('input,textarea'))return;
 if(e.key==='v'||e.key==='V'||e.key==='ر')toggle();
});

/* some browsers only allow speech after the first tap: unlock it once, silently */
function unlock(){document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)}
document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);
try{window.speechSynthesis.onvoiceschanged=function(){}}catch(e){}
window.addEventListener('pagehide',stop);
})();
