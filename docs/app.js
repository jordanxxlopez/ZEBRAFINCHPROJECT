const $=s=>document.querySelector(s);
const all=s=>[...document.querySelectorAll(s)];
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=async path=>{const r=await fetch(path);if(!r.ok)throw Error(`Could not load ${path} (${r.status})`);return r.json();};
const message=text=>{const box=$('#global-status');box.textContent=text;box.hidden=false;};
let atlas,volume,labels,recordings=[],sources=[],page=0,currentAudio=null,meshViewer=null;
let atlasReady;
const pages=['home','species','paper-hamaguchi','atlas','recordings','films','studies','methods'];
function route(){
 const hash=location.hash.slice(1)||'home';if(hash==='content'){$('#content').focus();return;}const id=pages.includes(hash)?hash:document.getElementById(hash)?.closest('.page')?.id||'home';
 all('.page').forEach(p=>p.hidden=p.id!==id);
 all('nav a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 all('audio').filter(a=>a.closest('.page')?.id!==id).forEach(a=>a.pause());
 all('video').filter(v=>v.closest('.page')?.id!==id).forEach(v=>v.pause());
 if(pages.includes(hash))window.scrollTo(0,0);else requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView());
 document.title=id==='home'?'Animal Communication & Neuroscience':({species:'Zebra finch collection','paper-hamaguchi':'HVC auditory-feedback experiment',atlas:'Brain atlas',recordings:'Sound archive',films:'Research films',studies:'Research library',methods:'Data and methods'}[id])+' | Animal Communication & Neuroscience';
 if(id==='atlas')requestAnimationFrame(()=>{drawSlice();meshViewer?.resize();});
}
window.addEventListener('hashchange',route);route();
async function compressed(path){const r=await fetch(path);if(!r.ok)throw Error('Atlas file unavailable');const stream=r.body.pipeThrough(new DecompressionStream('gzip'));const a=new Uint8Array(await new Response(stream).arrayBuffer());if(a.length!==256**3)throw Error('Atlas volume length mismatch');return a;}
function point(axis,s,u,v){return axis==='z'?[u,255-v,s]:axis==='y'?[u,s,255-v]:[s,u,255-v];}
function draw(canvas,axis,s,overlay=false,selected=0){
 if(!volume)return;
 const ctx=canvas.getContext('2d');const img=ctx.createImageData(256,256);
 for(let v=0;v<256;v++)for(let u=0;u<256;u++){
  const [x,y,z]=point(axis,s,u,v);const i=x+256*y+65536*z,j=(v*256+u)*4,value=volume[i];
  let rgb=value===0?[24,33,31]:[value,value,value];const label=labels?.[i]||0;
  if(overlay&&label&&(selected===0||label===selected)){
   const hex=atlas.regions[label].color;
   const c=[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16));rgb=rgb.map((t,k)=>Math.round(t*.35+c[k]*.65));
  }
  img.data.set([...rgb,255],j);
 }
 ctx.putImageData(img,0,0);
}
function drawSlice(){
 if(!volume)return;
 const axis=$('#plane').value,s=+$('#slice').value;
 draw($('#slice-canvas'),axis,s,$('#overlay').checked,+$('#region').value);
 $('#plane-label').textContent=`GRID ${axis.toUpperCase()} SECTION`;
 $('#slice-position').textContent=`Slice ${s} / 255 · ${(s*.08).toFixed(2)} mm from grid origin`;
 $('#slice-value').textContent=s;
 $('.scale-rule').style.width=($('#slice-canvas').getBoundingClientRect().width*25/256)+'px';
}
function regionDetail(){
 if(!atlas)return;const r=atlas.regions[+$('#region').value];
 $('#region-detail').innerHTML=`<dl class="region-metrics"><div><dt>Label voxels</dt><dd>${r.voxel_count.toLocaleString()}</dd></div><div><dt>Mask volume</dt><dd>${r.volume_mm3.toFixed(3)} mm³</dd></div><div><dt>Grid extent (X, Y, Z)</dt><dd>${r.extent_mm.join(' × ')} mm</dd></div></dl>`;
 if(r.id){const axis={x:0,y:1,z:2}[$('#plane').value];$('#slice').value=Math.round((r.bounds_mm[0][axis]+r.bounds_mm[1][axis])/2/.08);}
 drawSlice();meshViewer?.select(r.id);
}
$('#plane').addEventListener('change',()=>{regionDetail();drawSlice();});
$('#slice').addEventListener('input',drawSlice);$('#overlay').addEventListener('change',()=>{drawSlice();meshViewer?.select(+$('#region').value);});
$('#region').addEventListener('change',regionDetail);
$('#brain-shell').addEventListener('change',()=>meshViewer?.select(+$('#region').value));
window.addEventListener('resize',()=>{drawSlice();meshViewer?.resize();});
$('#slice-mode').addEventListener('click',()=>setAtlasMode(false));
$('#surface-mode').addEventListener('click',()=>setAtlasMode(true));
async function setAtlasMode(surface){
 $('#slice-panel').hidden=surface;$('#surface-panel').hidden=!surface;
 for(const [id,active] of [['slice-mode',!surface],['surface-mode',surface]]){$('#'+id).classList.toggle('active',active);$('#'+id).setAttribute('aria-pressed',active);}
 if(surface){
  try{await atlasReady;if(!meshViewer){$('#atlas-status').textContent='Loading measured anatomical surfaces…';meshViewer=await createMeshViewer();}meshViewer.resize();$('#atlas-status').textContent='Source-label reconstruction · millimetres · no smoothing';}
  catch(e){$('#atlas-status').textContent='3D display could not load. MRI sections and downloads remain available.';console.error(e);}
 }else{$('#atlas-status').textContent='Original MRI · contrast window applied for display · regional labels optional';drawSlice();}
}
$('#reset-atlas').addEventListener('click',()=>{$('#region').value='0';$('#plane').value='z';$('#slice').value=140;$('#overlay').checked=true;$('#brain-shell').checked=true;regionDetail();meshViewer?.reset();});
async function createMeshViewer(){
 const [THREE,{OrbitControls},data]=await Promise.all([import('./assets/three.module.js'),import('./assets/OrbitControls.js'),get('data/atlas-meshes.json')]);
 const container=$('#three-view'),scene=new THREE.Scene();scene.background=new THREE.Color('#151d1b');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(35,1,.1,200);camera.up.set(0,0,1);camera.position.set(23,-24,20);
 const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=12;controls.maxDistance=75;controls.enablePan=false;
 const group=new THREE.Group();scene.add(group);const center=atlas.regions[0].bounds_mm[0].map((v,i)=>(v+atlas.regions[0].bounds_mm[1][i])/2);
 const objects=[];
 for(const item of data){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(item.vertices,3));geometry.setIndex(item.faces);geometry.computeVertexNormals();geometry.translate(...center.map(v=>-v));
  const material=new THREE.MeshPhongMaterial({color:atlas.regions[item.id].color,side:THREE.DoubleSide,transparent:item.id===0,opacity:item.id===0?.16:1,depthWrite:item.id!==0,shininess:20});
  const mesh=new THREE.Mesh(geometry,material);group.add(mesh);objects.push(mesh);
 }
 scene.add(new THREE.AmbientLight(0xffffff,1.35));const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(15,-20,30);scene.add(light);const back=new THREE.DirectionalLight(0xb0c6cf,1.2);back.position.set(-20,10,10);scene.add(back);
 const render=()=>renderer.render(scene,camera);
 const resize=()=>{const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();};
 const select=id=>{objects.forEach((o,i)=>{o.visible=i===0?$('#brain-shell').checked:$('#overlay').checked&&(id===0||i===id);});render();};
 const reset=()=>{group.rotation.set(0,0,0);camera.position.set(23,-24,20);controls.target.set(0,0,0);controls.update();select(0);};
 controls.addEventListener('change',render);
 container.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')group.rotation.z-=.12;if(e.key==='ArrowRight')group.rotation.z+=.12;if(e.key==='ArrowUp')group.rotation.x-=.12;if(e.key==='ArrowDown')group.rotation.x+=.12;if(['+','='].includes(e.key))camera.position.multiplyScalar(.9);if(e.key==='-')camera.position.multiplyScalar(1.1);controls.update();render();}});
 select(+$('#region').value);resize();return{resize,select,reset};
}
function filteredRecordings(){const q=$('#recording-search').value.trim().toLowerCase();const a=recordings.filter(r=>r.name.toLowerCase().includes(q));return a.sort($('#recording-sort').value==='duration'?(a,b)=>b.duration_seconds-a.duration_seconds:(a,b)=>a.name.localeCompare(b.name));}
function renderRecordings(){
 const filtered=filteredRecordings(),size=12;const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
 $('#recording-count').textContent=`${filtered.length} of 887 recordings`;
 $('#recording-list').innerHTML=filtered.slice(page*size,(page+1)*size).map(r=>`<div class="recording-row ${currentAudio===r.name?'selected':''}"><span class="recording-name">${escapeHTML(r.name)}</span><span class="duration">${r.duration_seconds.toFixed(3)} s</span><button data-audio="${escapeHTML(r.name)}" aria-label="Listen to ${escapeHTML(r.name)}">Listen</button><a href="${r.url}" download aria-label="Download ${escapeHTML(r.name)}">WAV ↓</a></div>`).join('')||'<p class="empty">No recordings match that filename. Try a shorter search.</p>';
 $('#recording-page').textContent=`Page ${page+1} of ${pages}`;$('#recording-prev').disabled=page===0;$('#recording-next').disabled=page>=pages-1;
}
$('#recording-search').addEventListener('input',()=>{page=0;renderRecordings();});$('#recording-sort').addEventListener('change',()=>{page=0;renderRecordings();});
$('#recording-prev').addEventListener('click',()=>{page--;renderRecordings();});$('#recording-next').addEventListener('click',()=>{page++;renderRecordings();});
let audioContext;
$('#recording-list').addEventListener('click',async e=>{
 const button=e.target.closest('[data-audio]');if(!button)return;
 const r=recordings.find(r=>r.name===button.dataset.audio);currentAudio=r.name;
 $('#audio-title').textContent=r.name;const player=$('#audio-player');player.hidden=false;player.src=r.url;player.play().catch(()=>{});
 $('#audio-detail').textContent=`${r.duration_seconds.toFixed(3)} s · ${r.sample_rate.toLocaleString()} Hz · ${r.channels===1?'mono':r.channels+' channels'} · original WAV`;
 const link=$('#audio-download');link.href=r.url;link.hidden=false;renderRecordings();
 try{
  audioContext ||=new AudioContext();const response=await fetch(r.url);const buffer=await audioContext.decodeAudioData(await response.arrayBuffer());
  if(currentAudio!==r.name)return;
  const samples=buffer.getChannelData(0),canvas=$('#waveform'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,700,160);ctx.strokeStyle='#a3aba1';ctx.beginPath();ctx.moveTo(0,80);ctx.lineTo(700,80);ctx.stroke();ctx.strokeStyle='#8b4634';ctx.lineWidth=1;
  for(let x=0;x<700;x++){const start=Math.floor(x*samples.length/700),end=Math.max(start+1,Math.floor((x+1)*samples.length/700));let min=0,max=0;for(let i=start;i<end;i++){min=Math.min(min,samples[i]);max=Math.max(max,samples[i]);}ctx.beginPath();ctx.moveTo(x,80-min*74);ctx.lineTo(x,80-max*74);ctx.stroke();}
 }catch(e){$('#audio-detail').textContent+=' · waveform unavailable';}
});
function renderStudies(){
 const q=$('#study-search').value.toLowerCase().trim(),sector=$('#study-sector').value;
 const rows=sources.filter(r=>(sector==='all'||r.sector===sector)&&[r.title,r.modality,r.doi,r.proposed_analysis].join(' ').toLowerCase().includes(q));
 $('#study-count').textContent=`${rows.length} resources`;
 $('#study-list').innerHTML=rows.map(r=>`<article class="study"><span class="study-sector">${escapeHTML(r.sector)}</span><div><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.modality)}</p><details><summary>Data, methods & review status</summary><p><b>Possible analysis.</b> ${escapeHTML(r.proposed_analysis)}</p><p><b>Review status.</b> ${escapeHTML(r.review_status)}</p><p><b>Interpretation.</b> ${escapeHTML(r.limitation)}</p><p><b>Reuse.</b> ${escapeHTML(r.rights)}</p>${r.doi?`<p>DOI: <a href="https://doi.org/${encodeURI(r.doi)}">${escapeHTML(r.doi)}</a></p>`:''}</details></div><a href="${escapeHTML(r.source_url)}">View source ↗</a></article>`).join('')||'<p class="empty">No matching resources. Try a different term or collection.</p>';
}
$('#study-search').addEventListener('input',renderStudies);$('#study-sector').addEventListener('change',renderStudies);
atlasReady=(async()=>{
 [atlas,volume,labels]=await Promise.all([get('data/atlas.json'),compressed('data/atlas-volume.bin.gz'),compressed('data/atlas-labels.bin.gz')]);
 $('#region').innerHTML=atlas.regions.map(r=>`<option value="${r.id}">${escapeHTML(r.name)}</option>`).join('');
 draw($('#hero-x'),'x',126);draw($('#hero-y'),'y',135);draw($('#hero-z'),'z',140);regionDetail();
 $('#atlas-status').textContent='Original MRI · contrast window applied for display · regional labels optional';
})().catch(e=>{message('The atlas could not load. Check your connection and reload; source downloads remain linked.');throw e;});
Promise.all([get('data/recordings.json'),get('data/sources.json')]).then(([r,s])=>{recordings=r;sources=s;renderRecordings();renderStudies();}).catch(e=>message(e.message));

// Reading aids use the original published image; no panel is redrawn.
const paperPanelNotes={
 a:'Panel A is the authors’ schematic of the zebra finch preparation. Red marks the song motor pathway; blue marks the anterior forebrain pathway. The electrode records an HVC cell projecting to Area X. This published circuit drawing is not a measured tractogram or a spatial registration to our MRI atlas.',
 b:'Panel B illustrates a spike-collision test used to identify an HVC neuron projecting to Area X. A stimulus in Area X can evoke a spike traveling back toward HVC. Its collision with a naturally generated spike helps establish the projection identity; the voltage and time scale bars apply to these traces.',
 c:'Panel C shows the feedback manipulation. The real-time system detects a target in the song sequence and triggers playback on hit trials. On catch trials playback is withheld. This is the authors’ experimental schematic, not a simulation created for this site.',
 d:'Panel D pairs a song spectrogram with an intracellular voltage recording. Frequency is in kHz, time in milliseconds and voltage in mV. The orange interval marks feedback playback. The bottom traces expand the comparison of hit and catch conditions. These are example observations; Figure 2 provides the population analysis.'
};
all('[data-paper-panel]').forEach(button=>button.addEventListener('click',()=>{
 all('[data-paper-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('#figure-panel-note').textContent=paperPanelNotes[button.dataset.paperPanel];
}));
all('[data-enlarge]').forEach(button=>button.addEventListener('click',()=>{
 const original=document.getElementById(button.dataset.enlarge);
 $('#enlarged-original-figure').src=original.src;$('#enlarged-original-figure').alt=original.alt;
 $('#figure-dialog').showModal();
}));
