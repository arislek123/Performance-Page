'use strict';
window.CygnusViews={};
window.CygnusUtils={
 clamp:(value,min=0,max=1)=>Math.max(min,Math.min(max,value)),
 smooth:(a,b,p)=>{const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t);},
 lerp:(a,b,p)=>a+(b-a)*p,
 // Stable pen irregularity travels with each crest, rather than flickering between frames.
 waveSketch(x,row){return .7*Math.sin(x*.043+row*.63)+.24*Math.sin(x*.117-row*.93)+.10*Math.sin(x*.241+row*1.13)+.38*Math.sin(row*.31);},
 waveY(x,row,phase,amplitude){const envelope=.45+.55*Math.exp(-(((x-500)/340)**2));return -102+row*8+Math.sin(x*.012+row*.13-phase)*amplitude*envelope+Math.sin(x*.025-row*.08+phase*.6)*amplitude*.2+this.waveSketch(x,row);},
 wavePen(row){return {width:(row%4===0?1.05:.65)*(.94+.12*Math.sin(row*2.17)),opacity:(.2+.23*row/89)*(.94+.09*Math.sin(row*1.73))};},
 waveRetrace(x,row){return .75+.22*Math.sin(x*.08+row*.6);},
 svg(tag,attrs={},parent){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));if(parent)parent.appendChild(node);return node;},
 text(parent,x,y,value,attrs={}){const n=this.svg('text',{x,y,fill:'#52748e','font-family':'Arial,sans-serif','font-size':14,...attrs},parent);n.textContent=value;return n;},
 line(points){return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');},
 trace(path,p){let length=path._cygnusLength;if(!length){try{length=path.getTotalLength();}catch{length=1000;}path._cygnusLength=length;}path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length*(1-this.clamp(p)));}
};

'use strict';
window.CygnusNotebook=ctx=>{
 const scene=ctx.root.querySelector('#research-notebook');if(!scene)return;
 const U=window.CygnusUtils,S=(...a)=>U.svg(...a),svg=scene.querySelector('svg'),defs=svg.querySelector('defs'),paint=svg.querySelector('[data-paper-strips]'),strips=[];
 svg.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
 const count=32,width=800/count;
 for(let i=0;i<count;i++){
  const clip=S('clipPath',{id:'paper-strip-'+i,clipPathUnits:'userSpaceOnUse'},defs);
  S('rect',{x:i*width-.3,y:0,width:width+.6,height:760},clip);
  const surface=S('g',{'data-paper-strip':i},paint),crop=S('g',{'clip-path':'url(#paper-strip-'+i+')'},surface);
  const instance=S('use',{},crop);instance.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','#notebook-sheet');strips.push(surface);
 }
 let previous=-1;
 ctx.onUpdate(()=>{
  const p=ctx.progress(scene,{start:.96,distance:(innerHeight||800)*.85});if(p===previous)return;previous=p;
  const phase=p*Math.PI*2.3,amplitude=ctx.reduced()?0:6+15*Math.sin(Math.PI*p),k=Math.PI*2/1100;
  strips.forEach((strip,i)=>{const x=(i+.5)*width,angle=x*k-phase,dy=amplitude*Math.sin(angle),slope=amplitude*k*Math.cos(angle);strip.setAttribute('transform',`matrix(1 ${slope.toFixed(5)} 0 1 0 ${(dy-slope*x).toFixed(3)})`);});
  scene.dataset.progress=p.toFixed(4);
 });
};

'use strict';
window.CygnusWaveField=(scene,ctx)=>{
 const U=window.CygnusUtils,S=(tag,a,p)=>U.svg(tag,a,p),svg=scene.querySelector('svg'),field=S('g',{fill:'none','stroke-linecap':'round'},svg),lines=[],retraces=[];
 svg.setAttribute('preserveAspectRatio','none');
 // Overscan each edge: changing wave amplitude never reveals an empty strip.
 for(let i=0;i<89;i++){const pen=U.wavePen(i);lines.push(S('path',{stroke:'#547e94','stroke-width':pen.width,opacity:pen.opacity,'data-wave-row':i},field));if(i%7===2)retraces.push({row:i,path:S('path',{stroke:'#547e94','stroke-width':.35,opacity:.085,'data-pencil-retrace':i},field)});}
 const ship=S('g',{'data-wave-vessel':''},svg);
 S('path',{d:'M502 148Q479 182 480 222L483 353Q486 378 502 381Q518 378 521 353L524 222Q525 182 502 148Z',fill:'#607f90',opacity:.12,transform:'translate(2 4)'},ship);
 S('path',{d:'M500 143Q478 181 479 220L482 353Q486 376 500 381Q514 376 518 353L521 220Q522 181 500 143Z',fill:'#edf2f4',stroke:'#547184','stroke-width':1.3},ship);
 S('path',{d:'M500 156Q483 185 484 222L487 351Q490 369 500 373Q510 369 513 351L516 222Q517 185 500 156Z',fill:'#dde7ec',stroke:'#a6b9c3','stroke-width':.65},ship);
 for(let i=0;i<6;i++){const y=203+i*22;S('path',{d:`M488 ${y+.3}L511.6 ${y-.2}L512.2 ${y+15.8}L488.3 ${y+16.2}Z`,fill:'#d6e0e6',stroke:'#849eaf','stroke-width':.65},ship);}
 S('path',{d:'M499 147Q477 182 481 222L483.4 351Q487 375 500.4 378Q514 374 517 352L520 221Q522 183 501.3 146',fill:'none',stroke:'#547184','stroke-width':.55,opacity:.42},ship);
 S('path',{d:'M486 198V339M514 198V339M488 189H512M491 180H509',fill:'none',stroke:'#97aebc','stroke-width':.7},ship);
 S('rect',{x:486,y:343,width:28,height:19,rx:2,fill:'#f7fafb',stroke:'#6a8e9f','stroke-width':.8},ship);
 S('path',{d:'M487 347H513M490 350H510M495 368H505M500 173V187',stroke:'#607e91','stroke-width':1.2},ship);
 S('rect',{x:497,y:355,width:6,height:10,rx:1,fill:'#879ca8'},ship);
 let shipScale=1,previousP=-1,previousScale=-1;const resize=()=>{const r=svg.getBoundingClientRect();shipScale=r.width&&r.height?2*r.height/r.width:1;};resize();ctx.onResize(resize);
 const progress=ctx.track(scene,{repeat:true});
 let controlled=false;
 function draw(p){if(p===previousP&&shipScale===previousScale)return;previousP=p;previousScale=shipScale;const phase=p*22,amplitude=22+22*U.smooth(0,1,p);lines.forEach((path,i)=>{const pts=[];for(let x=-16;x<=1016;x+=4)pts.push([x,U.waveY(x,i,phase,amplitude)]);path.setAttribute('d',U.line(pts));});retraces.forEach(({row,path})=>{const pts=[];for(let x=-16;x<=1016;x+=4)pts.push([x,U.waveY(x,row,phase,amplitude)+U.waveRetrace(x,row)]);path.setAttribute('d',U.line(pts));});const sway=Math.sin(phase*.55)*7+Math.sin(phase*.23)*2,surge=Math.sin(phase*.55-.7)*4,yaw=Math.cos(phase*.55)*2.2;ship.setAttribute('transform',`translate(${500+sway} ${270+surge}) scale(${shipScale} 1) rotate(${yaw}) translate(-500 -270)`);scene.dataset.waveProgress=p.toFixed(4);}
 ctx.onUpdate(()=>{const p=progress();scene.dataset.progress=p.toFixed(4);if(!controlled)draw(p);});
 return {svg,lines:field,ship,draw,control(value){controlled=value;}};
};
window.CygnusKelvin=(scene,ctx)=>{
 const U=window.CygnusUtils,S=(tag,a,p)=>U.svg(tag,a,p),svg=scene.querySelector('svg');svg.setAttribute('viewBox','0 0 1000 500');
 const defs=S('defs',{},svg),clip=S('clipPath',{id:'kelvin-clip'},defs),reveal=S('rect',{x:650,y:0,width:0,height:500},clip);
 const grid=S('g',{stroke:'#739bb2','stroke-width':.45,opacity:.07},svg);for(let x=25;x<1000;x+=50)S('path',{d:`M${x} 35V465`},grid);for(let y=50;y<500;y+=50)S('path',{d:`M20 ${y}H980`},grid);
 const wake=S('g',{fill:'none',stroke:'#477d9e','stroke-width':1,'clip-path':'url(#kelvin-clip)',id:'kelvin-curves'},svg),crests=[],cusp=Math.acos(Math.sqrt(2/3));
 const position=(a,t)=>{const c=Math.cos(t),sn=Math.sin(t);return[650-a*c*(1+sn*sn),250+a*sn*c*c];};
 // Separate the transverse and divergent branches at the classical Kelvin cusp.
 for(let n=0;n<23;n++){const a=22+n*22,pts=[];for(let i=0;i<=100;i++)pts.push(position(a,-cusp+2*cusp*i/100));crests.push(S('path',{d:U.line(pts),opacity:.33+.34*(1-n/23),'data-wave-family':'transverse'},wake));if(n%3===1)for(const sign of [-1,1]){const points=[];for(let i=0;i<=70;i++)points.push(position(a,sign*(cusp+(1.32-cusp)*i/70)));crests.push(S('path',{d:U.line(points),opacity:.28,'stroke-width':.7,'data-wave-family':'divergent'},wake));}}
 const vessel=S('g',{id:'kelvin-vessel',transform:'translate(0 0)'},svg);S('path',{d:'M864 250Q842 228 807 227H669Q654 228 650 235V265Q654 272 669 273H807Q842 272 864 250Z',fill:'#eef5f9',stroke:'#4d748b','stroke-width':1.2},vessel);S('path',{d:'M846 250H663',stroke:'#a6bfce','stroke-width':.55,'stroke-dasharray':'4 5'},vessel);for(let i=0;i<5;i++)S('rect',{x:690+i*26,y:235,width:19,height:30,rx:1,fill:'#dae7f0',stroke:'#8daabd','stroke-width':.6},vessel);S('rect',{x:662,y:233,width:18,height:34,rx:2,fill:'#b4cfdf',stroke:'#60859d','stroke-width':.7},vessel);
 const progress=ctx.track(scene,{repeat:true});ctx.onUpdate(()=>{const p=progress(),reach=650*U.smooth(.02,.98,p);reveal.setAttribute('x',650-reach);reveal.setAttribute('width',reach);crests.forEach((crest,i)=>U.trace(crest,U.smooth(.02+(i%5)*.018,.63+(i/crests.length)*.32,p)));vessel.setAttribute('transform',`translate(${U.lerp(0,8,p)} 0)`);scene.dataset.progress=p.toFixed(4);});
};

'use strict';
window.CygnusPropeller=(scene,ctx)=>{
 const canvas=scene.querySelector('canvas'),g=canvas.getContext('2d');if(!g)return;
 const U=window.CygnusUtils,progress=ctx.track(scene,{repeat:true});let w=1000,h=530,scale=120,p=0;
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],subtract=(a,b)=>a.map((v,i)=>v-b[i]),normal=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
 const right=[.52,.854,0],up=[.239,-.146,.96],depth=[.82,-.5,-.28],light=normal([-.3,.1,1]);
 function project(v){const z=dot(v,depth),k=5/(5+z);return{x:w*.5+dot(v,right)*scale*k,y:h*.5-dot(v,up)*scale*k,z};}
 function line(points,color,alpha,width=1){g.strokeStyle=color;g.globalAlpha=alpha;g.lineWidth=width;g.beginPath();points.forEach((v,i)=>{const q=project(v);if(i)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y);});g.stroke();g.globalAlpha=1;}
 function blade(r,v,b){const theta=b*Math.PI/2+p*Math.PI*3.2+.28+r*.55+v*(1.25*Math.sin(Math.PI*r)**.55),radius=.23+r*1.06;return[.48*v*Math.sin(Math.PI*r)**.5-.1*r,radius*Math.cos(theta),radius*Math.sin(theta)];}
 function render(){
  g.clearRect(0,0,w,h);const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#f1f5f8');bg.addColorStop(1,'#e6ecf1');g.fillStyle=bg;g.fillRect(0,0,w,h);
  g.setLineDash([]);g.lineCap='round';g.lineJoin='round';
  // Helical downstream streamlines contract gradually behind the rotor plane.
  const reveal=U.smooth(0,.96,p),stream=[];for(let ring=0;ring<3;ring++)for(let j=0;j<6;j++){const pts=[],radius=.45+ring*.46,phase=j*Math.PI*2/6;for(let n=0;n<=240;n++){const x=-3.2+6.4*n/240;if(x> -3.2+6.4*reveal)break;const downstream=Math.log1p(Math.exp(4*x))/4,a=phase+downstream*(1.4+p*.9)+p*2.6,r=radius*(1-.14*U.smooth(0,3,x));pts.push([x,r*Math.cos(a),r*Math.sin(a)]);}stream.push({pts,z:dot([0,radius*Math.cos(phase),radius*Math.sin(phase)],depth)});}

  const faces=[],steps=w<600?12:19,cols=8;
  for(let b=0;b<4;b++)for(let i=0;i<steps;i++)for(let j=0;j<cols;j++){const r=i/steps,r2=(i+1)/steps,v=-.5+j/cols,v2=-.5+(j+1)/cols,points=[blade(r,v,b),blade(r2,v,b),blade(r2,v2,b),blade(r,v2,b)],n=normal(cross(subtract(points[1],points[0]),subtract(points[3],points[0]))),shade=.34+.66*Math.abs(dot(n,light));faces.push({points,z:points.reduce((sum,x)=>sum+dot(x,depth),0)/4,color:`rgb(${Math.round(105+112*shade)},${Math.round(105+112*shade)},${Math.round(105+112*shade)})`});}
  const lathe=(x1,x2,r1,r2,steel=false)=>{for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16,points=[[x1,r1*Math.cos(a),r1*Math.sin(a)],[x2,r2*Math.cos(a),r2*Math.sin(a)],[x2,r2*Math.cos(b),r2*Math.sin(b)],[x1,r1*Math.cos(b),r1*Math.sin(b)]],shade=.5+.5*Math.cos(a-.7);faces.push({points,z:points.reduce((sum,x)=>sum+dot(x,depth),0)/4,color:`rgb(${Math.round(120+85*shade)},${Math.round(120+85*shade)},${Math.round(120+85*shade)})`});}};
  lathe(-2.65,-.3,.085,.085,true);lathe(-.36,.3,.24,.27);lathe(.3,.65,.27,.025);
  faces.sort((a,b)=>b.z-a.z).forEach(face=>{g.beginPath();face.points.forEach((v,i)=>{const q=project(v);if(i)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y);});g.closePath();g.fillStyle=face.color;g.fill();g.strokeStyle=face.color;g.lineWidth=.45;g.stroke();});
  stream.forEach(s=>line(s.pts,'#657985',.43,1));
  canvas.dataset.rotation=(p*Math.PI*3.2).toFixed(4);canvas.dataset.flow=reveal.toFixed(4);
 }
 function resize(){const b=canvas.getBoundingClientRect();w=b.width||1000;h=b.height||530;const d=Math.min(window.devicePixelRatio||1,1.6);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);g.setTransform(d,0,0,d,0,0);scale=Math.min(w*.14,h*.31);render();}
 ctx.onResize(resize);ctx.onUpdate(()=>{p=progress();scene.dataset.progress=p.toFixed(4);render();});resize();
};

'use strict';
window.CygnusOcean = scene => {
  let canvas = scene.root.querySelector('#sea');
  if (!canvas) return;
  const host = canvas.parentElement;
  const gl = canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
  let raf = null, time = 0, phase = 0, morph = 0, waveProgress = 0, displayWidth = 0, displayHeight = 0, suspended = false;
  const pointer = {x:0.5,y:0.42,tx:0.5,ty:0.42,power:0,target:0,at:0};
  const vertex = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}`;
  const fragment = `precision highp float;
  uniform vec2 u_res;uniform vec2 u_display;uniform vec2 u_mouse;uniform float u_time;uniform float u_power;uniform float u_morph;uniform float u_wave;
  vec2 mouseWorld;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
  float surface(vec2 pos){
    vec2 p=pos*0.62;float t=u_time;
    float h=sin(dot(p,vec2(1.0,0.32))*1.85+t*0.83)*0.20;
    h+=sin(dot(p,vec2(-0.35,1.0))*2.9-t*0.57)*0.12;
    h+=sin(dot(p,vec2(0.82,-0.57))*5.1+t*0.73)*0.06;
    h+=(noise(p*3.6+vec2(t*0.11,-t*0.14))-0.5)*0.065;
    vec2 delta=pos-mouseWorld;float distance=length(delta);
    h+=u_power*0.44*sin(distance*4.4-t*3.4)*exp(-distance*0.31);
    h-=u_power*0.36*exp(-distance*distance*0.8);
    return h*(1.0-0.78*smoothstep(0.05,0.8,u_morph));
  }
  vec3 eye(){return mix(vec3(0.0,5.8,7.0),vec3(0.0,11.0,0.02),smoothstep(0.05,0.78,u_morph));}
  vec3 ray(vec2 uv){vec3 f=normalize(-eye());vec3 r=vec3(1.0,0.0,0.0);vec3 up=normalize(cross(r,f));return normalize(f+uv.x*0.58*r+uv.y*0.58*up);}
  float sketch(float x,float row){return 0.7*sin(x*0.043+row*0.63)+0.24*sin(x*0.117-row*0.93)+0.10*sin(x*0.241+row*1.13)+0.38*sin(row*0.31);}
  float waveY(float x,float row,float phase,float amplitude){float envelope=0.45+0.55*exp(-pow((x-500.0)/340.0,2.0));return -102.0+8.0*row+sin(x*0.012+row*0.13-phase)*amplitude*envelope+sin(x*0.025-row*0.08+phase*0.6)*amplitude*0.2+sketch(x,row);}
  vec3 waveField(vec2 uv){
    float x=uv.x*1000.0,y=(1.0-uv.y)*500.0,phase=u_wave*22.0,amplitude=22.0+22.0*smoothstep(0.0,1.0,u_wave),row=(y+102.0)/8.0;
    float envelope=0.45+0.55*exp(-pow((x-500.0)/340.0,2.0));
    // Invert the monotone row mapping instead of looping over all 89 curves per pixel.
    for(int i=0;i<6;i++){float derivative=8.0+amplitude*envelope*0.13*cos(x*0.012+row*0.13-phase)-amplitude*0.016*cos(x*0.025-row*0.08+phase*0.6)+0.441*cos(x*0.043+row*0.63)-0.2232*cos(x*0.117-row*0.93)+0.113*cos(x*0.241+row*1.13)+0.1178*cos(row*0.31);row-=clamp((waveY(x,row,phase,amplitude)-y)/max(1.5,derivative),-6.0,6.0);}
    float nearest=floor(row+0.5),distance=abs(y-waveY(x,nearest,phase,amplitude));
    float width=(mod(nearest,4.0)<0.5?0.525:0.325)*(0.94+0.12*sin(nearest*2.17)),aa=0.7*500.0/u_res.y;
    float ink=(1.0-smoothstep(max(0.0,width-aa),width+aa,distance))*(0.2+0.23*clamp(nearest/89.0,0.0,1.0))*(0.94+0.09*sin(nearest*1.73));
    if(mod(nearest,7.0)>1.5&&mod(nearest,7.0)<2.5){float retrace=abs(y-waveY(x,nearest,phase,amplitude)-0.75-0.22*sin(x*0.08+nearest*0.6));ink=1.0-(1.0-ink)*(1.0-(1.0-smoothstep(max(0.0,0.175-aa),0.175+aa,retrace))*0.085);}
    return mix(vec3(243.0,247.0,250.0)/255.0,vec3(84.0,126.0,148.0)/255.0,ink);
  }
  void main(){
    vec2 screen=gl_FragCoord.xy/u_res,uv=(screen*2.0-1.0)*vec2(u_display.x/u_display.y,1.0);
    vec2 muv=(u_mouse*2.0-1.0)*vec2(u_display.x/u_display.y,1.0);
    vec3 ro=eye();vec3 mray=ray(muv);
    mouseWorld=(ro+mray*(-ro.y/mray.y)).xz;
    vec3 rd=ray(uv);float distance=-ro.y/rd.y;
    for(int i=0;i<4;i++){vec3 p=ro+rd*distance;distance=(surface(p.xz)-ro.y)/rd.y;}
    vec3 pos=ro+rd*distance;float e=0.018;
    float dx=surface(pos.xz+vec2(e,0.0))-surface(pos.xz-vec2(e,0.0));
    float dz=surface(pos.xz+vec2(0.0,e))-surface(pos.xz-vec2(0.0,e));
    vec3 n=normalize(vec3(-dx,2.0*e,-dz));vec3 view=normalize(ro-pos);
    vec3 reflected=reflect(-view,n);
    float fresnel=pow(1.0-max(dot(n,view),0.0),3.0);
    vec3 deep=vec3(0.30,0.58,0.73);vec3 reflectedSky=mix(vec3(0.45,0.70,0.86),vec3(0.78,0.90,0.97),clamp(reflected.y,0.0,1.0));
    vec3 col=mix(deep,reflectedSky,0.32+fresnel*0.55);
    vec3 light=normalize(vec3(-0.25,0.85,-0.38));
    float spec=pow(max(dot(reflect(-light,n),view),0.0),75.0);
    float silver=pow(max(0.0,1.0-abs(reflected.x+0.3)),18.0)*pow(max(reflected.y,0.0),3.0);
    col+=vec3(0.35,0.54,0.75)*(spec*0.85+silver*0.32);
    col+=vec3(0.025,0.06,0.08)*pow(max(n.y,0.0),9.0);
    float fog=1.0-exp(-distance*0.018);col=mix(col,vec3(0.64,0.82,0.93),fog*0.7);
    vec2 mesh=abs(sin(pos.xz*2.4));
    float grid=1.0-smoothstep(0.025,0.065,min(mesh.x,mesh.y));
    float contour=1.0-smoothstep(0.035,0.085,abs(sin(pos.y*27.0)));
    col=mix(col,vec3(0.25,0.48,0.65),grid*0.15+contour*0.055);
    vec3 water=pow(col,vec3(0.88)),curves=water;if(u_morph>0.001)curves=waveField(screen);
    float flatten=smoothstep(0.18,0.98,u_morph);
    gl_FragColor=vec4(mix(water,curves,flatten),1.0);
  }`;
  let render, resize;
  function fallback() {
    if (gl) {const replacement=document.createElement('canvas');replacement.id='sea';replacement.setAttribute('aria-hidden','true');canvas.replaceWith(replacement);canvas=replacement;}
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let w=1,h=1;
    resize=()=>{w=host.clientWidth;h=host.clientHeight;const d=Math.min(window.devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);render();};
    render=()=>{
      const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#a1d9ed');gradient.addColorStop(.45,'#89c7e4');gradient.addColorStop(1,'#c9ddeb');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
      for(let row=0;row<45;row++){
        ctx.beginPath();const base=h*(row/45);ctx.strokeStyle=`rgba(50,119,158,${(.10+row/450)*(1-morph)})`;ctx.lineWidth=.8;
        for(let x=0;x<=w;x+=8){const dx=x-w*pointer.x,dy=base-h*pointer.y,d=Math.hypot(dx,dy);const ripple=Math.sin(d*.032-time*3)*Math.exp(-d/260)*pointer.power*38;const y=base+Math.sin(x/140+row*.2+time*.8)*(8+row*.2)+ripple;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
      }
      const flat=window.CygnusUtils.smooth(.18,.98,morph);ctx.globalAlpha=flat;ctx.fillStyle='#f3f7fa';ctx.fillRect(0,0,w,h);
      if(flat>0){const U=window.CygnusUtils,a=22+22*U.smooth(0,1,waveProgress),phase=waveProgress*22;for(let row=0;row<89;row++){const pen=U.wavePen(row);for(let pass=0;pass<(row%7===2?2:1);pass++){ctx.beginPath();ctx.strokeStyle=`rgba(84,126,148,${pass?.085:pen.opacity})`;ctx.lineWidth=(pass?.35:pen.width)*h/500;for(let x=-16;x<=1016;x+=4){const y=U.waveY(x,row,phase,a)+(pass?U.waveRetrace(x,row):0);if(x===-16)ctx.moveTo(x/1000*w,y/500*h);else ctx.lineTo(x/1000*w,y/500*h);}ctx.stroke();}}}ctx.globalAlpha=1;
    };
  }
  if(gl){
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
    if(vs&&fs){
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(gl.getProgramParameter(program,gl.LINK_STATUS)){
        scene.cleanup(()=>{gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);});
        gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
        const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
        const res=gl.getUniformLocation(program,'u_res'),display=gl.getUniformLocation(program,'u_display'),mouse=gl.getUniformLocation(program,'u_mouse'),clock=gl.getUniformLocation(program,'u_time'),power=gl.getUniformLocation(program,'u_power'),shape=gl.getUniformLocation(program,'u_morph'),wave=gl.getUniformLocation(program,'u_wave');
        resize=()=>{const d=Math.min(window.devicePixelRatio||1,1.25,1600/host.clientWidth);canvas.width=Math.round(host.clientWidth*d);canvas.height=Math.round(host.clientHeight*d);gl.viewport(0,0,canvas.width,canvas.height);render();};
        render=()=>{gl.uniform2f(res,canvas.width,canvas.height);gl.uniform2f(display,displayWidth||host.clientWidth,displayHeight||host.clientHeight);gl.uniform2f(mouse,pointer.x,1-pointer.y);gl.uniform1f(clock,time);gl.uniform1f(power,pointer.power);gl.uniform1f(shape,morph);gl.uniform1f(wave,waveProgress);gl.drawArrays(gl.TRIANGLES,0,3);};
      }else fallback();
    }else fallback();
  }else fallback();
  if(!render||!resize)return;
  function frame(){
    raf=null;if(scene.signal.aborted||suspended)return;
    const reduced=scene.reduced();
    pointer.x+=(pointer.tx-pointer.x)*.22;pointer.y+=(pointer.ty-pointer.y)*.22;
    pointer.power+=(pointer.target-pointer.power)*.2;
    time=phase+(reduced?0:pointer.x*.55+pointer.y*.35);
    render();
    if(!reduced&&(Math.abs(pointer.tx-pointer.x)+Math.abs(pointer.ty-pointer.y)+Math.abs(pointer.target-pointer.power)>.002))raf=requestAnimationFrame(frame);
  }
  function request(){if(!suspended&&raf===null)raf=requestAnimationFrame(frame);}
  scene.on(host,'pointermove',e=>{if(scene.reduced())return;const b=host.getBoundingClientRect();pointer.tx=(e.clientX-b.left)/b.width;pointer.ty=(e.clientY-b.top)/b.height;pointer.target=1.25;request();},{passive:true});
  scene.on(host,'pointerleave',()=>{pointer.target=0;request();});
  scene.onUpdate(()=>{phase=scene.reduced()?0:scene.progress(host,{start:0,distance:(innerHeight||800)*.55,repeat:true})*4;request();});
  scene.onResize(resize);
  scene.on(canvas,'webglcontextlost',e=>{e.preventDefault();if(raf!==null)cancelAnimationFrame(raf);raf=null;});
  scene.cleanup(()=>{if(raf!==null)cancelAnimationFrame(raf);});
  resize();request();
  return {canvas,present(state){morph=state.morph;waveProgress=state.wave;displayWidth=state.width;displayHeight=state.height;suspended=state.active===false;canvas.dataset.morph=morph.toFixed(4);canvas.dataset.wave=waveProgress.toFixed(4);if(suspended){if(raf!==null)cancelAnimationFrame(raf);raf=null;}else request();}};
};

'use strict';
window.CygnusOceanTransition=(ctx,ocean,field)=>{
 const hero=ctx.root.querySelector('.ocean-hero'),spacer=ctx.root.querySelector('.ocean-transfer');
 if(!hero||!spacer||!ocean||!field){if(spacer)spacer.hidden=true;return;}
 const U=window.CygnusUtils,canvas=ocean.canvas,layer=document.createElement('div');layer.className='ocean-morph-layer';layer.setAttribute('aria-hidden','true');ctx.root.prepend(layer);
 let previous='';
 function restore(){field.control(false);field.draw(Number(field.svg.parentElement.dataset.progress)||0);if(canvas.parentElement!==hero)hero.prepend(canvas);canvas.style.cssText='';layer.style.display='none';field.lines.style.opacity='1';field.ship.style.opacity='1';}
 ctx.onUpdate(()=>{
  const reduced=ctx.reduced();spacer.hidden=reduced;
  const origin=hero.getBoundingClientRect(),target=field.svg.getBoundingClientRect(),vh=innerHeight||800,vw=window.innerWidth||origin.width;
  if(reduced){previous='';restore();ocean.present({morph:0,wave:0,width:origin.width,height:origin.height,active:origin.bottom>0});hero.dataset.transition='1.0000';return;}
  const heroHeight=origin.height,start=heroHeight*.12,end=target.top+scrollY-(origin.top+scrollY)-vh*.38,distance=Math.max(vh*.9,end-start);
  const p=ctx.progress(hero,{start:-start/vh,distance,repeat:true}),q=U.smooth(.1,1,p),morph=U.smooth(.04,.96,p),targetWave=Number(field.svg.parentElement.dataset.progress)||0;
  const signature=[p,target.top,target.width,target.height,vw,vh].join('|');if(signature===previous)return;previous=signature;
  if(canvas.parentElement!==layer){layer.appendChild(canvas);canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';}
  const sourceTop=origin.top>=0?origin.top:-heroHeight*.12*(1-Math.exp(origin.top/(heroHeight*.12)));
  const left=U.lerp(0,target.left,q),top=U.lerp(sourceTop,target.top,q),width=U.lerp(vw,target.width,q),height=U.lerp(heroHeight,target.height,q),handoff=U.smooth(.94,1,p);
  layer.style.display=p>=1?'none':'block';layer.style.transform=`translate3d(${left.toFixed(3)}px,${top.toFixed(3)}px,0)`;layer.style.width=width.toFixed(3)+'px';layer.style.height=height.toFixed(3)+'px';layer.style.borderRadius=(8*q).toFixed(3)+'px';layer.style.opacity=String(1-handoff);
  field.lines.style.opacity=String(handoff);field.ship.style.opacity=String(U.smooth(.78,.97,p));
  const wave=p<1?U.smooth(0,1,p)*(2/3):targetWave;field.control(p<1);field.draw(wave);
  ocean.present({morph,wave,width,height,active:p<1});
  hero.dataset.transition=p.toFixed(4);layer.dataset.progress=p.toFixed(4);layer.dataset.target=targetWave.toFixed(4);
 });
 ctx.onResize(()=>{previous='';});ctx.cleanup(()=>{restore();layer.remove();});
};

window.CygnusLandPoints=[[-171,-84],[-150,-84],[-147,-84],[-144,-84],[-141,-84],[-138,-84],[-135,-84],[-132,-84],[-129,-84],[-126,-84],[-123,-84],[-120,-84],[-117,-84],[-114,-84],[-111,-84],[-108,-84],[-105,-84],[-102,-84],[-99,-84],[-96,-84],[-93,-84],[-90,-84],[-87,-84],[-84,-84],[-81,-84],[-78,-84],[-75,-84],[-72,-84],[-69,-84],[-66,-84],[-63,-84],[-60,-84],[-57,-84],[-54,-84],[-51,-84],[-48,-84],[-45,-84],[-42,-84],[-39,-84],[-36,-84],[-33,-84],[-30,-84],[-27,-84],[-24,-84],[-21,-84],[-18,-84],[-15,-84],[-12,-84],[-9,-84],[-6,-84],[-3,-84],[0,-84],[3,-84],[6,-84],[9,-84],[12,-84],[15,-84],[18,-84],[21,-84],[24,-84],[27,-84],[30,-84],[33,-84],[36,-84],[39,-84],[42,-84],[45,-84],[48,-84],[51,-84],[54,-84],[57,-84],[60,-84],[63,-84],[66,-84],[69,-84],[72,-84],[75,-84],[78,-84],[81,-84],[84,-84],[87,-84],[90,-84],[93,-84],[96,-84],[99,-84],[102,-84],[105,-84],[108,-84],[111,-84],[114,-84],[117,-84],[120,-84],[123,-84],[126,-84],[129,-84],[132,-84],[135,-84],[138,-84],[141,-84],[144,-84],[147,-84],[150,-84],[153,-84],[156,-84],[159,-84],[162,-84],[165,-84],[168,-84],[171,-84],[-147,-81],[-144,-81],[-141,-81],[-138,-81],[-135,-81],[-132,-81],[-129,-81],[-126,-81],[-123,-81],[-120,-81],[-117,-81],[-114,-81],[-111,-81],[-108,-81],[-105,-81],[-102,-81],[-99,-81],[-96,-81],[-93,-81],[-90,-81],[-87,-81],[-84,-81],[-81,-81],[-78,-81],[-75,-81],[-72,-81],[-51,-81],[-33,-81],[-30,-81],[-27,-81],[-24,-81],[-21,-81],[-18,-81],[-15,-81],[-12,-81],[-9,-81],[-6,-81],[-3,-81],[0,-81],[3,-81],[6,-81],[9,-81],[12,-81],[15,-81],[18,-81],[21,-81],[24,-81],[27,-81],[30,-81],[33,-81],[36,-81],[39,-81],[42,-81],[45,-81],[48,-81],[51,-81],[54,-81],[57,-81],[60,-81],[63,-81],[66,-81],[69,-81],[72,-81],[75,-81],[78,-81],[81,-81],[84,-81],[87,-81],[90,-81],[93,-81],[96,-81],[99,-81],[102,-81],[105,-81],[108,-81],[111,-81],[114,-81],[117,-81],[120,-81],[123,-81],[126,-81],[129,-81],[132,-81],[135,-81],[138,-81],[141,-81],[144,-81],[147,-81],[150,-81],[153,-81],[156,-81],[159,-81],[-156,-78],[-153,-78],[-150,-78],[-147,-78],[-144,-78],[-141,-78],[-138,-78],[-135,-78],[-132,-78],[-129,-78],[-126,-78],[-123,-78],[-120,-78],[-117,-78],[-114,-78],[-111,-78],[-108,-78],[-105,-78],[-102,-78],[-99,-78],[-96,-78],[-93,-78],[-90,-78],[-87,-78],[-84,-78],[-81,-78],[-78,-78],[-75,-78],[-33,-78],[-30,-78],[-27,-78],[-24,-78],[-21,-78],[-18,-78],[-15,-78],[-12,-78],[-9,-78],[-6,-78],[-3,-78],[0,-78],[3,-78],[6,-78],[9,-78],[12,-78],[15,-78],[18,-78],[21,-78],[24,-78],[27,-78],[30,-78],[33,-78],[36,-78],[39,-78],[42,-78],[45,-78],[48,-78],[51,-78],[54,-78],[57,-78],[60,-78],[63,-78],[66,-78],[69,-78],[72,-78],[75,-78],[78,-78],[81,-78],[84,-78],[87,-78],[90,-78],[93,-78],[96,-78],[99,-78],[102,-78],[105,-78],[108,-78],[111,-78],[114,-78],[117,-78],[120,-78],[123,-78],[126,-78],[129,-78],[132,-78],[135,-78],[138,-78],[141,-78],[144,-78],[147,-78],[150,-78],[153,-78],[156,-78],[159,-78],[162,-78],[-138,-75],[-135,-75],[-132,-75],[-129,-75],[-126,-75],[-123,-75],[-120,-75],[-117,-75],[-114,-75],[-111,-75],[-105,-75],[-99,-75],[-96,-75],[-93,-75],[-90,-75],[-87,-75],[-84,-75],[-81,-75],[-78,-75],[-75,-75],[-72,-75],[-69,-75],[-66,-75],[-15,-75],[-12,-75],[-9,-75],[-6,-75],[-3,-75],[0,-75],[3,-75],[6,-75],[9,-75],[12,-75],[15,-75],[18,-75],[21,-75],[24,-75],[27,-75],[30,-75],[33,-75],[36,-75],[39,-75],[42,-75],[45,-75],[48,-75],[51,-75],[54,-75],[57,-75],[60,-75],[63,-75],[66,-75],[69,-75],[72,-75],[75,-75],[78,-75],[81,-75],[84,-75],[87,-75],[90,-75],[93,-75],[96,-75],[99,-75],[102,-75],[105,-75],[108,-75],[111,-75],[114,-75],[117,-75],[120,-75],[123,-75],[126,-75],[129,-75],[132,-75],[135,-75],[138,-75],[141,-75],[144,-75],[147,-75],[150,-75],[153,-75],[156,-75],[159,-75],[162,-75],[165,-75],[-102,-72],[-99,-72],[-72,-72],[-69,-72],[-66,-72],[-63,-72],[-9,-72],[-6,-72],[-3,-72],[0,-72],[3,-72],[6,-72],[9,-72],[12,-72],[15,-72],[18,-72],[21,-72],[24,-72],[27,-72],[30,-72],[33,-72],[36,-72],[39,-72],[42,-72],[45,-72],[48,-72],[51,-72],[54,-72],[57,-72],[60,-72],[63,-72],[66,-72],[72,-72],[75,-72],[78,-72],[81,-72],[84,-72],[87,-72],[90,-72],[93,-72],[96,-72],[99,-72],[102,-72],[105,-72],[108,-72],[111,-72],[114,-72],[117,-72],[120,-72],[123,-72],[126,-72],[129,-72],[132,-72],[135,-72],[138,-72],[141,-72],[144,-72],[147,-72],[150,-72],[153,-72],[156,-72],[159,-72],[162,-72],[165,-72],[168,-72],[171,-72],[-66,-69],[42,-69],[45,-69],[48,-69],[51,-69],[54,-69],[57,-69],[60,-69],[63,-69],[66,-69],[69,-69],[81,-69],[84,-69],[87,-69],[90,-69],[93,-69],[96,-69],[99,-69],[102,-69],[105,-69],[108,-69],[111,-69],[114,-69],[117,-69],[120,-69],[123,-69],[126,-69],[129,-69],[132,-69],[135,-69],[138,-69],[141,-69],[144,-69],[147,-69],[150,-69],[153,-69],[-63,-66],[54,-66],[114,-66],[135,-66],[-72,-54],[-69,-54],[-75,-51],[-72,-51],[-75,-48],[-72,-48],[-69,-48],[-66,-48],[-72,-45],[-69,-45],[-66,-45],[168,-45],[171,-45],[-72,-42],[-69,-42],[-66,-42],[147,-42],[174,-42],[-72,-39],[-69,-39],[-66,-39],[-63,-39],[177,-39],[-72,-36],[-69,-36],[-66,-36],[-63,-36],[-60,-36],[141,-36],[144,-36],[147,-36],[150,-36],[174,-36],[-69,-33],[-66,-33],[-63,-33],[-60,-33],[-57,-33],[-54,-33],[21,-33],[24,-33],[27,-33],[117,-33],[120,-33],[123,-33],[135,-33],[138,-33],[141,-33],[144,-33],[147,-33],[150,-33],[-69,-30],[-66,-30],[-63,-30],[-60,-30],[-57,-30],[-54,-30],[-51,-30],[18,-30],[21,-30],[24,-30],[27,-30],[30,-30],[117,-30],[120,-30],[123,-30],[126,-30],[129,-30],[132,-30],[135,-30],[138,-30],[141,-30],[144,-30],[147,-30],[150,-30],[153,-30],[-69,-27],[-66,-27],[-63,-27],[-60,-27],[-57,-27],[-54,-27],[-51,-27],[18,-27],[21,-27],[24,-27],[27,-27],[30,-27],[114,-27],[117,-27],[120,-27],[123,-27],[126,-27],[129,-27],[132,-27],[135,-27],[138,-27],[141,-27],[144,-27],[147,-27],[150,-27],[153,-27],[-69,-24],[-66,-24],[-63,-24],[-60,-24],[-57,-24],[-54,-24],[-51,-24],[-48,-24],[15,-24],[18,-24],[21,-24],[24,-24],[27,-24],[30,-24],[33,-24],[45,-24],[114,-24],[117,-24],[120,-24],[123,-24],[126,-24],[129,-24],[132,-24],[135,-24],[138,-24],[141,-24],[144,-24],[147,-24],[150,-24],[-69,-21],[-66,-21],[-63,-21],[-60,-21],[-57,-21],[-54,-21],[-51,-21],[-48,-21],[-45,-21],[-42,-21],[15,-21],[18,-21],[21,-21],[24,-21],[27,-21],[30,-21],[33,-21],[45,-21],[48,-21],[117,-21],[120,-21],[123,-21],[126,-21],[129,-21],[132,-21],[135,-21],[138,-21],[141,-21],[144,-21],[147,-21],[165,-21],[-69,-18],[-66,-18],[-63,-18],[-60,-18],[-57,-18],[-54,-18],[-51,-18],[-48,-18],[-45,-18],[-42,-18],[12,-18],[15,-18],[18,-18],[21,-18],[24,-18],[27,-18],[30,-18],[33,-18],[36,-18],[45,-18],[48,-18],[123,-18],[126,-18],[129,-18],[132,-18],[135,-18],[138,-18],[141,-18],[144,-18],[-75,-15],[-72,-15],[-69,-15],[-66,-15],[-63,-15],[-60,-15],[-57,-15],[-54,-15],[-51,-15],[-48,-15],[-45,-15],[-42,-15],[-39,-15],[15,-15],[18,-15],[21,-15],[24,-15],[27,-15],[30,-15],[33,-15],[36,-15],[39,-15],[48,-15],[126,-15],[129,-15],[132,-15],[135,-15],[144,-15],[-75,-12],[-72,-12],[-69,-12],[-66,-12],[-63,-12],[-60,-12],[-57,-12],[-54,-12],[-51,-12],[-48,-12],[-45,-12],[-42,-12],[-39,-12],[15,-12],[18,-12],[21,-12],[24,-12],[27,-12],[30,-12],[33,-12],[36,-12],[39,-12],[-78,-9],[-75,-9],[-72,-9],[-69,-9],[-66,-9],[-63,-9],[-60,-9],[-57,-9],[-54,-9],[-51,-9],[-48,-9],[-45,-9],[-42,-9],[-39,-9],[-36,-9],[15,-9],[18,-9],[21,-9],[24,-9],[27,-9],[30,-9],[33,-9],[36,-9],[39,-9],[117,-9],[126,-9],[141,-9],[147,-9],[-81,-6],[-78,-6],[-75,-6],[-72,-6],[-69,-6],[-66,-6],[-63,-6],[-60,-6],[-57,-6],[-54,-6],[-51,-6],[-48,-6],[-45,-6],[-42,-6],[-39,-6],[-36,-6],[15,-6],[18,-6],[21,-6],[24,-6],[27,-6],[30,-6],[33,-6],[36,-6],[141,-6],[144,-6],[147,-6],[150,-6],[-78,-3],[-75,-3],[-72,-3],[-69,-3],[-66,-3],[-63,-3],[-60,-3],[-57,-3],[-54,-3],[-51,-3],[-48,-3],[-45,-3],[-42,-3],[12,-3],[15,-3],[18,-3],[21,-3],[24,-3],[27,-3],[30,-3],[33,-3],[36,-3],[39,-3],[102,-3],[105,-3],[111,-3],[114,-3],[120,-3],[129,-3],[138,-3],[141,-3],[-78,0],[-75,0],[-72,0],[-69,0],[-66,0],[-63,0],[-60,0],[-57,0],[-54,0],[-51,0],[12,0],[15,0],[18,0],[21,0],[24,0],[27,0],[30,0],[33,0],[36,0],[39,0],[42,0],[102,0],[111,0],[114,0],[117,0],[120,0],[-75,3],[-72,3],[-69,3],[-66,3],[-63,3],[-60,3],[-57,3],[-54,3],[-51,3],[12,3],[15,3],[18,3],[21,3],[24,3],[27,3],[30,3],[33,3],[36,3],[39,3],[42,3],[45,3],[99,3],[102,3],[114,3],[117,3],[-75,6],[-72,6],[-69,6],[-66,6],[-63,6],[-60,6],[-9,6],[-6,6],[-3,6],[0,6],[6,6],[9,6],[12,6],[15,6],[18,6],[21,6],[24,6],[27,6],[30,6],[33,6],[36,6],[39,6],[42,6],[45,6],[48,6],[102,6],[117,6],[-78,9],[-75,9],[-72,9],[-69,9],[-66,9],[-63,9],[-12,9],[-9,9],[-6,9],[-3,9],[0,9],[3,9],[6,9],[9,9],[12,9],[15,9],[18,9],[21,9],[24,9],[27,9],[30,9],[33,9],[36,9],[39,9],[42,9],[45,9],[48,9],[78,9],[81,9],[99,9],[105,9],[126,9],[-84,12],[-72,12],[-15,12],[-12,12],[-9,12],[-6,12],[-3,12],[0,12],[3,12],[6,12],[9,12],[12,12],[15,12],[18,12],[21,12],[24,12],[27,12],[30,12],[33,12],[36,12],[39,12],[42,12],[51,12],[78,12],[99,12],[105,12],[108,12],[-90,15],[-87,15],[-84,15],[-15,15],[-12,15],[-9,15],[-6,15],[-3,15],[0,15],[3,15],[6,15],[9,15],[12,15],[15,15],[18,15],[21,15],[24,15],[27,15],[30,15],[33,15],[36,15],[39,15],[45,15],[48,15],[75,15],[78,15],[99,15],[102,15],[105,15],[108,15],[-102,18],[-99,18],[-96,18],[-93,18],[-90,18],[-66,18],[-15,18],[-12,18],[-9,18],[-6,18],[-3,18],[0,18],[3,18],[6,18],[9,18],[12,18],[15,18],[18,18],[21,18],[24,18],[27,18],[30,18],[33,18],[36,18],[42,18],[45,18],[48,18],[51,18],[54,18],[75,18],[78,18],[81,18],[96,18],[99,18],[102,18],[105,18],[-105,21],[-102,21],[-99,21],[-90,21],[-87,21],[-78,21],[-15,21],[-12,21],[-9,21],[-6,21],[-3,21],[0,21],[3,21],[6,21],[9,21],[12,21],[15,21],[18,21],[21,21],[24,21],[27,21],[30,21],[33,21],[36,21],[42,21],[45,21],[48,21],[51,21],[54,21],[57,21],[75,21],[78,21],[81,21],[84,21],[87,21],[93,21],[96,21],[99,21],[102,21],[105,21],[-105,24],[-102,24],[-99,24],[-15,24],[-12,24],[-9,24],[-6,24],[-3,24],[0,24],[3,24],[6,24],[9,24],[12,24],[15,24],[18,24],[21,24],[24,24],[27,24],[30,24],[33,24],[39,24],[42,24],[45,24],[48,24],[51,24],[54,24],[57,24],[69,24],[72,24],[75,24],[78,24],[81,24],[84,24],[87,24],[90,24],[93,24],[96,24],[99,24],[102,24],[105,24],[108,24],[111,24],[114,24],[117,24],[-114,27],[-108,27],[-105,27],[-102,27],[-99,27],[-81,27],[-12,27],[-9,27],[-6,27],[-3,27],[0,27],[3,27],[6,27],[9,27],[12,27],[15,27],[18,27],[21,27],[24,27],[27,27],[30,27],[33,27],[36,27],[39,27],[42,27],[45,27],[48,27],[54,27],[57,27],[60,27],[63,27],[66,27],[69,27],[72,27],[75,27],[78,27],[81,27],[84,27],[87,27],[90,27],[93,27],[96,27],[99,27],[102,27],[105,27],[108,27],[111,27],[114,27],[117,27],[120,27],[-111,30],[-108,30],[-105,30],[-102,30],[-99,30],[-96,30],[-93,30],[-90,30],[-9,30],[-6,30],[-3,30],[0,30],[3,30],[6,30],[9,30],[12,30],[15,30],[18,30],[21,30],[24,30],[27,30],[30,30],[33,30],[36,30],[39,30],[42,30],[45,30],[48,30],[51,30],[54,30],[57,30],[60,30],[63,30],[66,30],[69,30],[72,30],[75,30],[78,30],[81,30],[84,30],[87,30],[90,30],[93,30],[96,30],[99,30],[102,30],[105,30],[108,30],[111,30],[114,30],[117,30],[120,30],[-117,33],[-114,33],[-111,33],[-108,33],[-105,33],[-102,33],[-99,33],[-96,33],[-93,33],[-90,33],[-87,33],[-84,33],[-81,33],[-6,33],[-3,33],[0,33],[3,33],[6,33],[9,33],[36,33],[39,33],[42,33],[45,33],[48,33],[51,33],[54,33],[57,33],[60,33],[63,33],[66,33],[69,33],[72,33],[75,33],[78,33],[81,33],[84,33],[87,33],[90,33],[93,33],[96,33],[99,33],[102,33],[105,33],[108,33],[111,33],[114,33],[117,33],[120,33],[-120,36],[-117,36],[-114,36],[-111,36],[-108,36],[-105,36],[-102,36],[-99,36],[-96,36],[-93,36],[-90,36],[-87,36],[-84,36],[-81,36],[-78,36],[3,36],[6,36],[9,36],[39,36],[42,36],[45,36],[48,36],[51,36],[54,36],[57,36],[60,36],[63,36],[66,36],[69,36],[72,36],[75,36],[78,36],[81,36],[84,36],[87,36],[90,36],[93,36],[96,36],[99,36],[102,36],[105,36],[108,36],[111,36],[114,36],[117,36],[120,36],[129,36],[138,36],[-123,39],[-120,39],[-117,39],[-114,39],[-111,39],[-108,39],[-105,39],[-102,39],[-99,39],[-96,39],[-93,39],[-90,39],[-87,39],[-84,39],[-81,39],[-78,39],[-9,39],[-6,39],[-3,39],[21,39],[27,39],[30,39],[33,39],[36,39],[39,39],[42,39],[45,39],[48,39],[51,39],[54,39],[57,39],[60,39],[63,39],[66,39],[69,39],[72,39],[75,39],[78,39],[81,39],[84,39],[87,39],[90,39],[93,39],[96,39],[99,39],[102,39],[105,39],[108,39],[111,39],[114,39],[117,39],[126,39],[141,39],[-123,42],[-120,42],[-117,42],[-114,42],[-111,42],[-108,42],[-105,42],[-102,42],[-99,42],[-96,42],[-93,42],[-90,42],[-87,42],[-84,42],[-81,42],[-78,42],[-75,42],[-72,42],[-9,42],[-6,42],[-3,42],[0,42],[3,42],[9,42],[12,42],[15,42],[21,42],[24,42],[27,42],[42,42],[45,42],[48,42],[51,42],[54,42],[57,42],[60,42],[63,42],[66,42],[69,42],[72,42],[75,42],[78,42],[81,42],[84,42],[87,42],[90,42],[93,42],[96,42],[99,42],[102,42],[105,42],[108,42],[111,42],[114,42],[117,42],[120,42],[123,42],[126,42],[129,42],[141,42],[-123,45],[-120,45],[-117,45],[-114,45],[-111,45],[-108,45],[-105,45],[-102,45],[-99,45],[-96,45],[-93,45],[-90,45],[-87,45],[-84,45],[-81,45],[-78,45],[-75,45],[-72,45],[-69,45],[-63,45],[0,45],[3,45],[6,45],[9,45],[12,45],[15,45],[18,45],[21,45],[24,45],[27,45],[39,45],[42,45],[45,45],[48,45],[51,45],[54,45],[57,45],[60,45],[63,45],[66,45],[69,45],[72,45],[75,45],[78,45],[81,45],[84,45],[87,45],[90,45],[93,45],[96,45],[99,45],[102,45],[105,45],[108,45],[111,45],[114,45],[117,45],[120,45],[123,45],[126,45],[129,45],[132,45],[135,45],[-120,48],[-117,48],[-114,48],[-111,48],[-108,48],[-105,48],[-102,48],[-99,48],[-96,48],[-93,48],[-90,48],[-87,48],[-84,48],[-81,48],[-78,48],[-75,48],[-72,48],[-69,48],[-66,48],[-57,48],[-54,48],[-3,48],[0,48],[3,48],[6,48],[9,48],[12,48],[15,48],[18,48],[21,48],[24,48],[27,48],[30,48],[33,48],[36,48],[39,48],[42,48],[45,48],[48,48],[51,48],[54,48],[57,48],[60,48],[63,48],[66,48],[69,48],[72,48],[75,48],[78,48],[81,48],[84,48],[87,48],[90,48],[93,48],[96,48],[99,48],[102,48],[105,48],[108,48],[111,48],[114,48],[117,48],[120,48],[123,48],[126,48],[129,48],[132,48],[135,48],[138,48],[-126,51],[-123,51],[-120,51],[-117,51],[-114,51],[-111,51],[-108,51],[-105,51],[-102,51],[-99,51],[-96,51],[-93,51],[-90,51],[-87,51],[-84,51],[-81,51],[-78,51],[-75,51],[-72,51],[-69,51],[-66,51],[-63,51],[-60,51],[-57,51],[-3,51],[0,51],[3,51],[6,51],[9,51],[12,51],[15,51],[18,51],[21,51],[24,51],[27,51],[30,51],[33,51],[36,51],[39,51],[42,51],[45,51],[48,51],[51,51],[54,51],[57,51],[60,51],[63,51],[66,51],[69,51],[72,51],[75,51],[78,51],[81,51],[84,51],[87,51],[90,51],[93,51],[96,51],[99,51],[102,51],[105,51],[108,51],[111,51],[114,51],[117,51],[120,51],[123,51],[126,51],[129,51],[132,51],[135,51],[138,51],[-132,54],[-129,54],[-126,54],[-123,54],[-120,54],[-117,54],[-114,54],[-111,54],[-108,54],[-105,54],[-102,54],[-99,54],[-96,54],[-93,54],[-90,54],[-87,54],[-84,54],[-78,54],[-75,54],[-72,54],[-69,54],[-66,54],[-63,54],[-60,54],[-9,54],[9,54],[12,54],[15,54],[18,54],[21,54],[24,54],[27,54],[30,54],[33,54],[36,54],[39,54],[42,54],[45,54],[48,54],[51,54],[54,54],[57,54],[60,54],[63,54],[66,54],[69,54],[72,54],[75,54],[78,54],[81,54],[84,54],[87,54],[90,54],[93,54],[96,54],[99,54],[102,54],[105,54],[108,54],[111,54],[114,54],[117,54],[120,54],[123,54],[126,54],[129,54],[132,54],[135,54],[156,54],[159,54],[-132,57],[-129,57],[-126,57],[-123,57],[-120,57],[-117,57],[-114,57],[-111,57],[-108,57],[-105,57],[-102,57],[-99,57],[-96,57],[-93,57],[-90,57],[-75,57],[-72,57],[-69,57],[-66,57],[-63,57],[-6,57],[-3,57],[9,57],[15,57],[24,57],[27,57],[30,57],[33,57],[36,57],[39,57],[42,57],[45,57],[48,57],[51,57],[54,57],[57,57],[60,57],[63,57],[66,57],[69,57],[72,57],[75,57],[78,57],[81,57],[84,57],[87,57],[90,57],[93,57],[96,57],[99,57],[102,57],[105,57],[108,57],[111,57],[114,57],[117,57],[120,57],[123,57],[126,57],[129,57],[132,57],[135,57],[138,57],[159,57],[162,57],[-162,60],[-159,60],[-156,60],[-153,60],[-150,60],[-141,60],[-138,60],[-135,60],[-132,60],[-129,60],[-126,60],[-123,60],[-120,60],[-117,60],[-114,60],[-111,60],[-108,60],[-105,60],[-102,60],[-99,60],[-96,60],[-75,60],[-72,60],[6,60],[9,60],[12,60],[15,60],[18,60],[24,60],[30,60],[33,60],[36,60],[39,60],[42,60],[45,60],[48,60],[51,60],[54,60],[57,60],[60,60],[63,60],[66,60],[69,60],[72,60],[75,60],[78,60],[81,60],[84,60],[87,60],[90,60],[93,60],[96,60],[99,60],[102,60],[105,60],[108,60],[111,60],[114,60],[117,60],[120,60],[123,60],[126,60],[129,60],[132,60],[135,60],[138,60],[141,60],[144,60],[147,60],[150,60],[153,60],[162,60],[165,60],[-162,63],[-159,63],[-156,63],[-153,63],[-150,63],[-147,63],[-144,63],[-141,63],[-138,63],[-135,63],[-132,63],[-129,63],[-126,63],[-123,63],[-120,63],[-117,63],[-114,63],[-111,63],[-108,63],[-105,63],[-102,63],[-99,63],[-96,63],[-93,63],[-69,63],[-66,63],[-48,63],[-45,63],[9,63],[12,63],[15,63],[18,63],[24,63],[27,63],[30,63],[33,63],[36,63],[39,63],[42,63],[45,63],[48,63],[51,63],[54,63],[57,63],[60,63],[63,63],[66,63],[69,63],[72,63],[75,63],[78,63],[81,63],[84,63],[87,63],[90,63],[93,63],[96,63],[99,63],[102,63],[105,63],[108,63],[111,63],[114,63],[117,63],[120,63],[123,63],[126,63],[129,63],[132,63],[135,63],[138,63],[141,63],[144,63],[147,63],[150,63],[153,63],[156,63],[159,63],[162,63],[165,63],[168,63],[171,63],[174,63],[177,63],[-180,66],[-177,66],[-174,66],[-171,66],[-165,66],[-162,66],[-159,66],[-156,66],[-153,66],[-150,66],[-147,66],[-144,66],[-141,66],[-138,66],[-135,66],[-132,66],[-129,66],[-126,66],[-123,66],[-120,66],[-117,66],[-114,66],[-111,66],[-108,66],[-105,66],[-102,66],[-99,66],[-96,66],[-93,66],[-90,66],[-87,66],[-72,66],[-69,66],[-66,66],[-63,66],[-51,66],[-48,66],[-45,66],[-42,66],[-39,66],[-18,66],[-15,66],[15,66],[18,66],[21,66],[24,66],[27,66],[30,66],[33,66],[42,66],[45,66],[48,66],[51,66],[54,66],[57,66],[60,66],[63,66],[66,66],[69,66],[72,66],[75,66],[78,66],[81,66],[84,66],[87,66],[90,66],[93,66],[96,66],[99,66],[102,66],[105,66],[108,66],[111,66],[114,66],[117,66],[120,66],[123,66],[126,66],[129,66],[132,66],[135,66],[138,66],[141,66],[144,66],[147,66],[150,66],[153,66],[156,66],[159,66],[162,66],[165,66],[168,66],[171,66],[174,66],[177,66],[-162,69],[-159,69],[-156,69],[-153,69],[-150,69],[-147,69],[-144,69],[-141,69],[-138,69],[-135,69],[-132,69],[-129,69],[-126,69],[-123,69],[-120,69],[-111,69],[-108,69],[-96,69],[-93,69],[-84,69],[-75,69],[-72,69],[-69,69],[-51,69],[-48,69],[-45,69],[-42,69],[-39,69],[-36,69],[-33,69],[-30,69],[-27,69],[18,69],[21,69],[24,69],[27,69],[30,69],[33,69],[36,69],[63,69],[69,69],[72,69],[75,69],[78,69],[81,69],[84,69],[87,69],[90,69],[93,69],[96,69],[99,69],[102,69],[105,69],[108,69],[111,69],[114,69],[117,69],[120,69],[123,69],[126,69],[129,69],[132,69],[135,69],[138,69],[141,69],[144,69],[147,69],[150,69],[153,69],[156,69],[159,69],[162,69],[165,69],[168,69],[171,69],[174,69],[177,69],[-123,72],[-117,72],[-114,72],[-111,72],[-105,72],[-99,72],[-90,72],[-87,72],[-84,72],[-81,72],[-78,72],[-75,72],[-54,72],[-51,72],[-48,72],[-45,72],[-42,72],[-39,72],[-36,72],[-33,72],[-30,72],[-27,72],[-24,72],[54,72],[69,72],[72,72],[75,72],[78,72],[84,72],[87,72],[90,72],[93,72],[96,72],[99,72],[102,72],[105,72],[108,72],[111,72],[114,72],[117,72],[120,72],[123,72],[126,72],[141,72],[144,72],[147,72],[-111,75],[-108,75],[-99,75],[-96,75],[-90,75],[-87,75],[-84,75],[-81,75],[-57,75],[-54,75],[-51,75],[-48,75],[-45,75],[-42,75],[-39,75],[-36,75],[-33,75],[-30,75],[-27,75],[-24,75],[-21,75],[57,75],[60,75],[87,75],[90,75],[93,75],[96,75],[99,75],[102,75],[105,75],[108,75],[111,75],[138,75],[141,75],[144,75],[147,75],[150,75],[-111,78],[-84,78],[-81,78],[-78,78],[-72,78],[-69,78],[-66,78],[-63,78],[-60,78],[-57,78],[-54,78],[-51,78],[-48,78],[-45,78],[-42,78],[-39,78],[-36,78],[-33,78],[-30,78],[-27,78],[-24,78],[-21,78],[15,78],[18,78],[-93,81],[-87,81],[-84,81],[-81,81],[-78,81],[-75,81],[-72,81],[-69,81],[-63,81],[-60,81],[-57,81],[-54,81],[-51,81],[-48,81],[-45,81],[-42,81],[-39,81],[-36,81],[-33,81],[-30,81],[-27,81],[-24,81],[-21,81],[-18,81],[-15,81],[96,81]];
'use strict';
window.CygnusGlobe=scene=>{
 const canvas=scene.root.querySelector('#globe'),ctx=canvas?.getContext('2d');if(!ctx)return;
 const saved=scene.state('earth',{elapsed:0});
 const U=window.CygnusUtils,rad=Math.PI/180,land=window.CygnusLandPoints;
 let width=0,height=0,R=230,cx=0,cy=0,rotation=-.35,tilt=.12,raf=null,layoutRaf=null,last=0,ready=false,elapsed=Number.isFinite(saved.elapsed)?Math.max(0,saved.elapsed):0,particles=[];
 canvas.dataset.landParticles=String(land.length);canvas.dataset.ready='false';
 const random=n=>{const a=Math.sin(n*127.1+31.7)*43758.5453;return a-Math.floor(a);};
  const ports=[{name:'Piraeus',lon:23.63,lat:37.94},{name:'Singapore',lon:103.8,lat:1.26},{name:'Rotterdam',lon:4.14,lat:51.95},{name:'New York',lon:-74,lat:40.6},{name:'Shanghai',lon:121.9,lat:31.2}];
  const routes=[
    {name:'Piraeus to Singapore',color:'#8cdef1',points:[[23.63,37.94],[26,34],[32.3,31.2],[32.55,29.95],[38,19],[43.1,12.5],[54,9],[80,5.7],[96,5],[101,2],[103.8,1.26]]},
    {name:'Singapore to Rotterdam',color:'#bad4fc',points:[[103.8,1.26],[101,2],[96,5],[80,5.7],[65,-10],[40,-28],[18.5,-34.7],[10,-27],[-5,-10],[-19,15],[-15,28],[-6,35.9],[-9,46],[-2,50],[4.14,51.95]]},
    {name:'Rotterdam to New York',color:'#c5b6ef',points:[[4.14,51.95],[-2,50],[-9,48],[-35,46],[-58,42],[-74,40.6]]},
    {name:'Singapore to Shanghai',color:'#c3e9e8',points:[[103.8,1.26],[108,5],[113,13],[119,22],[123,28],[121.9,31.2]]}
  ];
  function vector(lon,lat){const l=lon*rad,p=lat*rad;return [Math.cos(p)*Math.sin(l),Math.sin(p),Math.cos(p)*Math.cos(l)];}
  function interpolate(a,b,t){const dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])),angle=Math.acos(dot);if(angle<.00001)return a;const divisor=Math.sin(angle),x=Math.sin((1-t)*angle)/divisor,y=Math.sin(t*angle)/divisor;return [a[0]*x+b[0]*y,a[1]*x+b[1]*y,a[2]*x+b[2]*y];}
  routes.forEach(route=>{route.vectors=[];for(let i=0;i<route.points.length-1;i++){const a=vector(...route.points[i]),b=vector(...route.points[i+1]),angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((sum,v,j)=>sum+v*b[j],0)))),steps=Math.max(4,Math.ceil(angle*95));for(let j=0;j<steps;j++)route.vectors.push(interpolate(a,b,j/steps));}route.vectors.push(vector(...route.points.at(-1)));});
 function project(v,altitude=1){const xx=v[0]*Math.cos(rotation)+v[2]*Math.sin(rotation),zz=-v[0]*Math.sin(rotation)+v[2]*Math.cos(rotation),yy=v[1]*Math.cos(tilt)-zz*Math.sin(tilt),z=v[1]*Math.sin(tilt)+zz*Math.cos(tilt);return{x:cx+xx*R*altitude,y:cy-yy*R*altitude,z};}
 function seed(){const count=width<500?3600:6200;particles=[];for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,phi=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);particles.push({v:[r*Math.cos(phi),y,r*Math.sin(phi)],land:false,seed:i});}land.forEach((p,i)=>particles.push({v:vector(p[0],p[1]),land:true,seed:i+6200}));canvas.dataset.particles=String(particles.length);}
 function routePath(vectors,fraction){ctx.beginPath();let connected=false;for(let i=0;i<Math.floor(vectors.length*fraction);i++){const p=project(vectors[i],1.018);if(p.z>0){if(connected)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);connected=true;}else connected=false;}ctx.stroke();}
 function render(){
  const reduced=scene.reduced(),formation=reduced?1:U.smooth(.1,2.4,elapsed),routeReveal=reduced?1:U.smooth(2.2,3.5,elapsed);rotation=-.35+(reduced?0:Math.max(0,elapsed-2.4)*.13);
  ctx.clearRect(0,0,width,height);
  for(const particle of particles){const p=project(particle.v),s=particle.seed,t=reduced?1:U.smooth(random(s)*.45,1,formation),x=U.lerp(width*random(s+34),p.x,t),y=U.lerp(height*random(s+57),p.y,t),front=p.z>0,alpha=particle.land?(front?.35+.6*p.z:.07):(front?.08+.21*p.z:.035);ctx.globalAlpha=U.lerp(particle.land?.55:.32,alpha,t);ctx.fillStyle=particle.land?'#2d6487':'#46718e';ctx.beginPath();ctx.arc(x,y,(particle.land?.85:.65)*Math.min(1.2,width/550),0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  routes.forEach((route,index)=>{ctx.globalAlpha=.65*routeReveal;ctx.strokeStyle=index%2?'#6f94b2':'#4c92b1';ctx.lineWidth=.8;routePath(route.vectors,routeReveal);ctx.globalAlpha=1;
   if(routeReveal<.1)return;const journey=reduced?.3+index*.13:((Math.max(0,elapsed-3.2)*(.035+index*.004)+index*.2)%1),at=journey*(route.vectors.length-1),i=Math.floor(at),p=project(interpolate(route.vectors[i],route.vectors[Math.min(i+1,route.vectors.length-1)],at-i),1.022),next=project(route.vectors[Math.min(i+3,route.vectors.length-1)],1.022);
   if(p.z>0){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(next.y-p.y,next.x-p.x)+Math.PI/2);ctx.globalAlpha=routeReveal;ctx.fillStyle='#f8fcff';ctx.strokeStyle='#397795';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(2.6,-1);ctx.lineTo(2.4,4);ctx.lineTo(-2.4,4);ctx.lineTo(-2.6,-1);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  });
  saved.elapsed=scene.reduced()?Math.max(3.5,elapsed):elapsed;ctx.globalAlpha=1;canvas.dataset.rotation=rotation.toFixed(4);canvas.dataset.formation=formation.toFixed(4);canvas.dataset.routesProgress=routeReveal.toFixed(4);canvas.dataset.elapsed=elapsed.toFixed(3);
 }
 function resize(){
  if(scene.signal.aborted)return;const b=canvas.getBoundingClientRect();
  if(!(b.width>0&&b.height>0)){ready=false;canvas.dataset.ready='false';return;}
  if(ready&&width===b.width&&height===b.height)return;
  width=b.width;height=b.height;const d=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);cx=width*.5;cy=height*.5;R=Math.min(width,height)*.43;seed();ready=true;canvas.dataset.ready='true';render();start();
 }
 function frame(now){raf=null;if(scene.signal.aborted||document.hidden||!ready)return;if(scene.reduced()){render();return;}if(!last)last=now;const dt=now-last;if(dt>=32){elapsed+=Math.min(dt/1000,.08);last=now;render();}raf=requestAnimationFrame(frame);}
 function start(){if(!ready||scene.signal.aborted)return;if(scene.reduced()){render();return;}if(raf===null&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
 scene.onResize(resize);scene.onUpdate(start);scene.on(document,'visibilitychange',()=>{if(document.hidden){if(raf!==null)cancelAnimationFrame(raf);raf=null;}else{resize();start();}});
 if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(resize);observer.observe(canvas);scene.cleanup(()=>observer.disconnect());}
 scene.cleanup(()=>{if(raf!==null)cancelAnimationFrame(raf);if(layoutRaf!==null)cancelAnimationFrame(layoutRaf);raf=null;layoutRaf=null;});
 resize();layoutRaf=requestAnimationFrame(()=>{layoutRaf=null;resize();start();});
};

'use strict';
window.CygnusViews.contact=scene=>window.CygnusGlobe(scene);

'use strict';
window.CygnusMiniCharts=ctx=>{
 const U=window.CygnusUtils,S=(...a)=>U.svg(...a),T=(...a)=>U.text(...a),blue='#3b88b0',lilac='#9b8ac4';
 const gauge=ctx.root.querySelector('#cii-mini-chart'),center=[215,169],r=111,colors=['#5393ab','#75b2c8','#9dc7df','#b5b1d6','#9c98ba'];
 const polar=(angle,radius)=>[center[0]+Math.cos(angle)*radius,center[1]-Math.sin(angle)*radius];
 for(let i=0;i<5;i++){const a=Math.PI-i*Math.PI/5-.012,b=Math.PI-(i+1)*Math.PI/5+.012,from=polar(a,r),to=polar(b,r);S('path',{d:`M${from}A${r} ${r} 0 0 1 ${to}`,fill:'none',stroke:colors[i],'stroke-width':8},gauge);const mid=Math.PI-(i+.5)*Math.PI/5,[x,y]=polar(mid,r+20);T(gauge,x,y+4,'ABCDE'[i],{'text-anchor':'middle','font-family':'monospace','font-size':12,fill:'#6b829b'});}
 const needle=S('g',{'data-cii-needle':''},gauge);S('path',{d:'M215 169V73',stroke:'#365b76','stroke-width':1.8,'stroke-linecap':'round'},needle);S('circle',{cx:215,cy:169,r:4,fill:'#eff7fc',stroke:'#365b76','stroke-width':1.6},gauge);
 S('path',{d:'M42 199H388',stroke:'#bdcfdd','stroke-width':.7},gauge);const band=T(gauge,44,229,'Band E',{'font-size':22,fill:'#34556f'}),value=T(gauge,386,229,'1.280',{'font-size':21,'font-family':'monospace','text-anchor':'end',fill:blue});
 ctx.onUpdate(()=>{const p=ctx.progress(gauge,{start:.9,distance:(innerHeight||800)*.65}),ratio=1.28-.23*U.smooth(.03,.97,p),angle=-90+(ratio-.7)/.6*180;needle.setAttribute('transform',`rotate(${angle} 215 169)`);band.textContent='Band '+(ratio>1.18?'E':ratio>1.06?'D':'C');value.textContent=ratio.toFixed(3);gauge.dataset.ratio=ratio.toFixed(3);gauge.dataset.progress=p.toFixed(4);});
 const svg=ctx.root.querySelector('#speed-mini-chart'),x=v=>45+(v-8)/8*350,y=v=>200-v/60*155;
 const grid=S('g',{stroke:'#a8c0d2','stroke-width':.6,opacity:.4},svg);for(const v of [20,40,60]){S('path',{d:`M45 ${y(v)}H395`},grid);T(svg,31,y(v)+3,String(v),{'font-family':'monospace','font-size':9,'text-anchor':'end'});}for(const v of [8,12,16])T(svg,x(v),219,String(v),{'font-family':'monospace','font-size':9,'text-anchor':'middle'});
 T(svg,45,25,'FUEL · t/day',{'font-family':'monospace','font-size':9});T(svg,395,241,'SPEED · kn',{'font-family':'monospace','font-size':9,'text-anchor':'end'});
 const points=Array.from({length:81},(_,i)=>{const v=8+i*.1;return[x(v),y(28*(v/13)**3)];}),upper=Array.from({length:81},(_,i)=>{const v=8+i*.1;return[x(v),y(28*(v/13)**3*1.12)];});
 const area=S('path',{d:U.line([[45,200],...points,[395,200]])+'Z',fill:'#b8dce9',opacity:0},svg),baseline=S('path',{d:U.line(points),stroke:blue,'stroke-width':1.9,fill:'none','data-speed-curve':'reference'},svg),measured=S('path',{d:U.line(upper),stroke:lilac,'stroke-width':1.65,fill:'none','data-speed-curve':'comparison'},svg);
 const guide=S('path',{d:`M${x(13)} 47V200M45 ${y(28)}H${x(13)}`,stroke:'#7ea6bb','stroke-width':.7,'stroke-dasharray':'2 4',fill:'none',opacity:0},svg),marker=S('circle',{cx:x(13),cy:y(28),r:3.8,fill:blue,stroke:'#f7fbff','stroke-width':1.8,opacity:0},svg),label=T(svg,x(13)+10,y(28)-12,'13 kn · 28 t/day',{'font-family':'monospace','font-size':9,fill:'#527c97',opacity:0});
 ctx.onUpdate(()=>{const p=ctx.progress(svg,{start:.9,distance:(innerHeight||800)*.69});U.trace(baseline,U.smooth(0,.94,p));U.trace(measured,U.smooth(.06,1,p));area.setAttribute('opacity',.2*U.smooth(.4,1,p));const q=U.smooth(.74,1,p);[guide,marker,label].forEach(n=>n.setAttribute('opacity',q));svg.dataset.progress=p.toFixed(4);});
};

'use strict';
window.CygnusIntelligence=(scene,ctx)=>{
 const U=window.CygnusUtils,S=(...a)=>U.svg(...a),T=(...a)=>U.text(...a),svg=scene.querySelector('svg'),progress=ctx.track(scene,{repeat:true});
 const shape=[[15,58],[40,42],[57,52],[78,23],[33,19],[66,77],[86,58],[20,29]],points=shape.map(([x,y])=>[190+x*4,20+y*4]),edges=[[0,1],[1,2],[2,3],[1,4],[2,5],[2,6],[1,7]];
 const scatter=S('g',{'data-knowledge-particles':''},svg),particles=[];
 for(let i=0;i<80;i++){
  const a=i*2.3999632297,r=80+((i*67)%290),start=[470+Math.cos(a)*r*1.18,215+Math.sin(a)*r*.53],target=points[i%8];
  particles.push({node:S('circle',{cx:start[0],cy:start[1],r:1.3+(i%3)*.45,fill:i%3?'#86abc5':'#a08ac8'},scatter),start,target});
 }
 const network=S('g',{'data-cygnus-network':'',fill:'none','stroke-linecap':'round'},svg);
 const links=edges.map(([a,b])=>S('path',{d:`M${points[a]}L${points[b]}`,stroke:'#759fb9','stroke-width':1.4,'data-cygnus-link':''},network));
 const stars=points.map(([cx,cy],i)=>S('circle',{cx,cy,r:i===2?7:i===1?5.7:3.4+(i%3)*.6,fill:'#9783bf',stroke:'#f5f8fc','stroke-width':1.4,'data-cygnus-star':i},svg));
 const flow=S('path',{d:'M534 252C612 252 605 215 684 215',fill:'none',stroke:'#759fb9','stroke-width':1.4,'data-finding-flow':''},svg);
 const result=S('g',{'data-knowledge-finding':'',opacity:0},svg);
 S('path',{d:'M684 124V314',stroke:'#b3a5cf','stroke-width':2},result);
 T(result,711,149,'AGENT WORKFLOW',{'font-family':'monospace','font-size':11,fill:'#526f86','data-agent-kicker':''});
 T(result,711,192,'Prepare request',{'font-family':'Georgia,serif','font-size':27,fill:'#3d6e8b'});
 const stages=['Read vessel report','Draft service request','Review with the team'];
 const stageRows=stages.map((label,i)=>{const row=S('g',{'data-agent-step':i},result),y=233+i*29;S('circle',{cx:716,cy:y-4,r:2.7,fill:i===2?'#9783bf':'#719db9'},row);T(row,731,y,label,{'font-size':13,fill:'#526f86'});return row;});
 const sourceLabels=S('g',{'data-agent-sources':''},svg);
 T(sourceLabels,108,130,'REPORTS',{'font-family':'monospace','font-size':10,fill:'#52748e'});
 T(sourceLabels,94,292,'REQUESTS',{'font-family':'monospace','font-size':10,fill:'#52748e'});
 const sourcePaths=[S('path',{d:'M165 127C212 127 215 150 267 156',fill:'none',stroke:'#b0c5d6','stroke-width':.8},sourceLabels),S('path',{d:'M162 287C211 287 218 264 246 252',fill:'none',stroke:'#b0c5d6','stroke-width':.8},sourceLabels)];
 function resize(){
  const mobile=(window.innerWidth||1000)<600;
  svg.setAttribute('viewBox',mobile?'0 0 680 610':'0 0 1000 430');result.setAttribute('transform',mobile?'translate(-490 260)':'translate(0 0)');
  flow.setAttribute('d',mobile?'M454 328C454 365 194 340 194 384':'M534 252C612 252 605 215 684 215');flow._cygnusLength=0;
  result.querySelector('[data-agent-kicker]').setAttribute('font-size',mobile?19:11);
  stageRows.forEach(row=>row.querySelector('text').setAttribute('font-size',mobile?20:13));sourceLabels.querySelectorAll('text').forEach(text=>text.setAttribute('font-size',mobile?18:10));
  sourcePaths[0].setAttribute('d',mobile?'M196 127C230 127 235 150 267 156':'M165 127C212 127 215 150 267 156');
  sourcePaths[1].setAttribute('d',mobile?'M190 287C220 287 225 264 246 252':'M162 287C211 287 218 264 246 252');sourcePaths.forEach(path=>path._cygnusLength=0);
 }
 ctx.onResize(resize);resize();
 let previous=-1;
 ctx.onUpdate(()=>{
  const p=progress();if(p===previous)return;previous=p;
  particles.forEach(({node,start,target},i)=>{const q=U.smooth(.015+(i%8)*.009,.49+(i%8)*.009,p),arc=Math.sin(Math.PI*q)*(i%2?20:-20);node.setAttribute('cx',U.lerp(start[0],target[0],q));node.setAttribute('cy',U.lerp(start[1],target[1],q)+arc);node.setAttribute('opacity',1-U.smooth(.43,.61,p));});
  stars.forEach((node,i)=>{node.setAttribute('opacity',U.smooth(.28+i*.018,.54+i*.018,p));node.setAttribute('r',(i===2?7:i===1?5.7:3.4+(i%3)*.6)*(.6+.4*U.smooth(.3,.64,p)));});
  links.forEach((path,i)=>U.trace(path,U.smooth(.4+i*.029,.67+i*.029,p)));
  sourceLabels.setAttribute('opacity',U.smooth(.18,.48,p));sourcePaths.forEach(path=>U.trace(path,U.smooth(.22,.55,p)));
  U.trace(flow,U.smooth(.67,.86,p));result.setAttribute('opacity',U.smooth(.72,.88,p));stageRows.forEach((row,i)=>row.setAttribute('opacity',U.smooth(.74+i*.055,.87+i*.055,p)));
  scene.dataset.progress=p.toFixed(4);scene.dataset.phase=p<.42?'gather':p<.78?'connect':'finding';
 });
};

'use strict';
(()=>{
const U=window.CygnusUtils,C={blue:'#3b88b0',sky:'#9bd9f4',lilac:'#a18acb',ink:'#24455b',muted:'#6b879c'},S=(...a)=>U.svg(...a),T=(...a)=>U.text(...a);
function homepage(ctx){
 const ocean=window.CygnusOcean(ctx),field=window.CygnusWaveField(ctx.root.querySelector('#company-wave-scene'),ctx);
 window.CygnusOceanTransition(ctx,ocean,field);
 const charts=Array.from(ctx.root.querySelectorAll('.mini-pressure'));
 ctx.onUpdate(()=>{for(const chart of charts){const p=ctx.progress(chart,{start:.87,distance:innerHeight*.67});chart.querySelectorAll('path.chart-line').forEach(path=>U.trace(path,p));chart.querySelectorAll('.chart-dots circle').forEach((dot,i)=>dot.style.opacity=String(U.smooth(i*.12,.18+i*.12,p)));chart.dataset.progress=p.toFixed(4);}});
 window.CygnusMiniCharts(ctx);
 window.CygnusNotebook(ctx);
}

function cylinderScene(ctx){
 const scene=ctx.root.querySelector('#engine-scene'),svg=scene.querySelector('svg'),stat=ctx.root.querySelector('#engine-stat-value');
 const progress=ctx.track(scene,{distance:.95,lead:.08}),defs=S('defs',{},svg),gradient=S('linearGradient',{id:'engine-bar-fill',x1:0,y1:0,x2:0,y2:1},defs);S('stop',{offset:0,'stop-color':'#80c2e4'},gradient);S('stop',{offset:1,'stop-color':'#d6eaf7'},gradient);
 const chart=S('g',{},svg),meanLine=S('path',{stroke:'#7594a9','stroke-width':1,'stroke-dasharray':'6 6',fill:'none',opacity:0,'data-mean-line':''},chart),bars=[],values=[];
 for(let i=0;i<6;i++){const x=115+i*151;bars.push(S('rect',{x:x-24,y:290,width:48,height:0,rx:9,fill:'url(#engine-bar-fill)','data-cylinder':i+1},chart));values.push(T(chart,x,145,'',{'text-anchor':'middle','font-family':'monospace','font-size':18,fill:C.blue}));T(chart,x,330,String(i+1),{'text-anchor':'middle','font-family':'monospace','font-size':13});}
 const trend=S('path',{fill:'none',stroke:C.blue,'stroke-width':2.3,'stroke-linejoin':'round','stroke-linecap':'round','data-cylinder-trend':''},chart),dots=Array.from({length:6},()=>S('circle',{r:4,fill:C.blue,opacity:0},chart));
 const deviation=T(chart,719,258,'−3.0 bar',{'text-anchor':'middle','font-family':'monospace','font-size':14,fill:'#bd4747','data-cylinder-deviation':''});
 ctx.onUpdate(()=>{
  const p=progress(),changing=U.smooth(.08,.4,p),draw=U.smooth(0,.23,p),morph=U.smooth(.35,.73,p),showMean=U.smooth(.76,.98,p),first=[121,124,122,126,121,123],last=[124,125,124,126,121,124],raw=first.map((v,i)=>U.lerp(v,last[i],changing)),mean=raw.reduce((a,b)=>a+b,0)/6,y=v=>290-(v-112)/28*240;
  stat.closest('.figure-result').style.opacity=String(showMean);
  for(let i=0;i<6;i++){const h=(290-y(raw[i]))*U.smooth(i*.02,.16+i*.02,p),outlier=i===4,color=outlier?'#bd4747':C.blue;bars[i].setAttribute('y',290-h);bars[i].setAttribute('height',h*(1-morph));bars[i].setAttribute('fill',outlier?'#d57979':'url(#engine-bar-fill)');bars[i].dataset.value=raw[i].toFixed(1);bars[i].dataset.deviation=(raw[i]-mean).toFixed(1);bars[i].dataset.status=outlier&&changing>.99?'out-of-limits':'normal';dots[i].setAttribute('cx',115+i*151);dots[i].setAttribute('cy',290-h);dots[i].setAttribute('opacity',morph);dots[i].setAttribute('fill',color);dots[i].setAttribute('r',outlier?5:4);values[i].setAttribute('fill',color);values[i].setAttribute('y',290-h-17);values[i].style.opacity=String(draw);values[i].textContent=raw[i].toFixed(1);}
  deviation.setAttribute('y',y(raw[4])+30);deviation.setAttribute('opacity',showMean);deviation.textContent=(raw[4]-mean).toFixed(1).replace('-','−')+' bar';
  trend.setAttribute('d',U.line(raw.map((v,i)=>[115+i*151,y(v)])));U.trace(trend,U.smooth(.35,.73,p));trend.setAttribute('opacity',morph);meanLine.setAttribute('d',`M60 ${y(mean)}H940`);meanLine.setAttribute('opacity',showMean);
  stat.textContent=mean.toFixed(1)+' bar';svg.setAttribute('aria-label','Illustrative Pmax measurements: average 124.0 bar. Cylinder 05 is 121.0 bar, 3.0 bar below average, highlighted red and outside the illustrative balance limit.');scene.dataset.presentation=morph>.9?'line':'bars';scene.dataset.progress=p.toFixed(4);scene.dataset.average=showMean.toFixed(4);
 });
}
function kelvinScene(ctx){window.CygnusKelvin(ctx.root.querySelector('#kelvin-scene'),ctx);}
function propellerScene(ctx){window.CygnusPropeller(ctx.root.querySelector('#propeller-scene'),ctx);}
function intelligenceScene(ctx){window.CygnusIntelligence(ctx.root.querySelector('#intelligence-scene'),ctx);}
window.CygnusViews.company=homepage;
window.CygnusViews.solutions=ctx=>{const hero=ctx.root.querySelector('.solutions-hero'),heroProgress=ctx.track(hero,{distance:.6,top:0});ctx.onUpdate(()=>{const p=heroProgress();hero.querySelectorAll('path.chart-line').forEach(path=>U.trace(path,U.smooth(.03,.88,p)));});cylinderScene(ctx);kelvinScene(ctx);propellerScene(ctx);intelligenceScene(ctx);};
})();

'use strict';
(()=>{
const pages=['index.html','solutions.html','contact.html'];
const documents=new Map(),assets=new Map(),animationMemory=new Map(),preference=matchMedia('(prefers-reduced-motion: reduce)');
let active=null,frame=null,navigationId=0,displayScroll=scrollY,lastFrame=0;
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
function schedule(){if(frame===null)frame=requestAnimationFrame(tick);}
function tick(now){
 frame=null;const dt=lastFrame?Math.min(64,now-lastFrame):16;lastFrame=now;
 displayScroll=preference.matches?scrollY:displayScroll+(scrollY-displayScroll)*(1-Math.exp(-dt/50));
 if(Math.abs(scrollY-displayScroll)<.15)displayScroll=scrollY;
 if(active)for(const fn of active.updates)fn();
 if(displayScroll!==scrollY)schedule();else lastFrame=0;
}
function context(root){
 const abort=new AbortController(),cleanups=[],updates=[],resizers=[],elementKeys=new WeakMap(),page=document.body.dataset.page;
 function key(el){if(!elementKeys.has(el))elementKeys.set(el,page+'|'+(el.id||'element-'+Array.from(root.querySelectorAll('*')).indexOf(el)));return elementKeys.get(el);}
 function retain(el,value){const name=key(el),maximum=Math.max(animationMemory.get(name)||0,value);animationMemory.set(name,maximum);return maximum;}
 const api={root,signal:abort.signal,updates,resizers,reduced:()=>preference.matches,
  on(target,type,fn,options={}){target.addEventListener(type,fn,options);cleanups.push(()=>target.removeEventListener(type,fn,options));},
  cleanup(fn){cleanups.push(fn);},onUpdate(fn){updates.push(fn);},onResize(fn){resizers.push(fn);},
  progress(el,options={}){if(preference.matches)return retain(el,1);const rect=el.getBoundingClientRect(),height=innerHeight||800,top=rect.top+scrollY-displayScroll;const value=CygnusUtils.clamp((height*(options.start??.86)-top)/(options.distance??height*.62));return options.repeat?value:retain(el,value);},
  track(el,options={}){
   // Measure the element in normal document flow. No wrapper, spacer, pin or scroll interception.
   const hero=el.classList.contains('page-hero');
   const slower=page==='solutions';return ()=>api.progress(el,hero?{start:0,distance:(innerHeight||800)*.52}:{start:slower?.98:.86,distance:(innerHeight||800)*(slower?.95:.72),repeat:!!options.repeat});
  },
  state(name,initial){const k=page+'|state|'+name;if(!animationMemory.has(k))animationMemory.set(k,initial);return animationMemory.get(k);},
  asset(path){if(!assets.has(path))assets.set(path,fetch(path,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Asset unavailable');return r.json();}).catch(e=>{assets.delete(path);throw e;}));return assets.get(path);},
  dispose(){abort.abort();for(const fn of cleanups.reverse())fn();updates.length=0;resizers.length=0;}
 };
 return api;
}
function mount(){
 displayScroll=scrollY;
 if(active)active.dispose();
 active=context(document.querySelector('main'));
 document.querySelectorAll('.year').forEach(e=>e.textContent=new Date().getFullYear());
 document.querySelectorAll('nav a').forEach(a=>{if(new URL(a.href,location.href).pathname===location.pathname||(location.pathname.endsWith('/')&&a.getAttribute('href')==='index.html'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 CygnusViews[document.body.dataset.page]?.(active);schedule();
}
function pageName(url){const filename=url.pathname.split('/').pop()||'index.html';return pages.includes(filename)?filename:null;}
function preload(name){
 if(!documents.has(name))documents.set(name,fetch(name,{credentials:'same-origin',cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Page unavailable');return r.text();}).then(html=>{const doc=new DOMParser().parseFromString(html,'text/html');if(!doc.querySelector('main'))throw Error('Missing page');return doc;}).catch(error=>{documents.delete(name);throw error;}));
 return documents.get(name);
}
function position(hash,y){
 if(hash){const target=document.getElementById(decodeURIComponent(hash.slice(1)));if(target){window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scrollY-100),behavior:'instant'});return;}}
 window.scrollTo({top:y||0,behavior:'instant'});
}
async function navigate(url,{pop=false,y=0}={}){
 const id=++navigationId,name=pageName(url);if(!name)return;
 closeMenu();
 try{
  const doc=await preload(name);if(id!==navigationId)return;
  const next=document.importNode(doc.querySelector('main'),true);
  if(!pop){history.replaceState({...(history.state||{}),y:scrollY},'',location.href);history.pushState({y:0},'',url.href);}
  if(active){active.dispose();active=null;}
  document.querySelector('main').replaceWith(next);document.body.dataset.page=doc.body.dataset.page;document.title=doc.title;
  const description=doc.querySelector('meta[name="description"]');if(description)document.querySelector('meta[name="description"]').content=description.content;
  mount();position(url.hash,y);displayScroll=scrollY;next.setAttribute('tabindex','-1');next.focus({preventScroll:true});schedule();
 }catch(error){if(id===navigationId)location.assign(url.href);}
}
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href]');if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
 const url=new URL(anchor.href,location.href);if(url.origin!==location.origin||!pageName(url))return;
 if(url.pathname===location.pathname){closeMenu();return;}
 event.preventDefault();navigate(url);
});
window.addEventListener('popstate',event=>navigate(new URL(location.href),{pop:true,y:event.state?.y||0}));
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',()=>{if(active)for(const fn of active.resizers)fn();schedule();},{passive:true});
preference.addEventListener('change',schedule);
if('scrollRestoration'in history)history.scrollRestoration='manual';
history.replaceState({...(history.state||{}),y:scrollY},'',location.href);
mount();
for(const page of pages)preload(page).catch(()=>{});
})();
