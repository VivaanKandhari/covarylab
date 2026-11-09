/* CovaryLab: explicit measurement models, no eval and no remote services.
   New implementation started 31 October 2026, after the STEMergent window opened. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CovaryLab = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const ZERO = [0,0,0,0,0,0,0]; // metre, kilogram, second, ampere, kelvin, mole, candela
  const units = {
    '1':[1,ZERO], m:[1,[1,0,0,0,0,0,0]], cm:[.01,[1,0,0,0,0,0,0]], mm:[.001,[1,0,0,0,0,0,0]],
    kg:[1,[0,1,0,0,0,0,0]], g:[.001,[0,1,0,0,0,0,0]], s:[1,[0,0,1,0,0,0,0]], ms:[.001,[0,0,1,0,0,0,0]], min:[60,[0,0,1,0,0,0,0]],
    A:[1,[0,0,0,1,0,0,0]], K:[1,[0,0,0,0,1,0,0]], mol:[1,[0,0,0,0,0,1,0]], cd:[1,[0,0,0,0,0,0,1]],
    Hz:[1,[0,0,-1,0,0,0,0]], N:[1,[1,1,-2,0,0,0,0]], J:[1,[2,1,-2,0,0,0,0]], Pa:[1,[-1,1,-2,0,0,0,0]], W:[1,[2,1,-3,0,0,0,0]],
    V:[1,[2,1,-3,-1,0,0,0]], ohm:[1,[2,1,-3,-2,0,0,0]]
  };
  const same = (a,b) => a.every((v,i)=>Math.abs(v-b[i])<1e-10);
  const dimAdd = (a,b,k=1)=>a.map((v,i)=>v+k*b[i]);
  const finite = (v,label)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error(label+' must be a finite number.');return v;};
  function unit(text) {
    if(typeof text!=='string'||text.length>100)throw Error('Unit must be a short string.');
    const compact=text.replace(/\s/g,'');
    if(!compact)throw Error('Use 1 for a dimensionless unit.');
    let scale=1,dim=ZERO.slice(),pos=0,sign=1;
    const re=/(1|[A-Za-z]+)(?:\^(-?\d+))?/y;
    while(pos<compact.length){
      re.lastIndex=pos;const m=re.exec(compact);
      if(!m||!Object.prototype.hasOwnProperty.call(units,m[1]))throw Error('Unknown or malformed unit: '+text);
      let power=Number(m[2]??1)*sign;if(Math.abs(power)>12)throw Error('Unit exponent is too large.');
      const u=units[m[1]];scale*=u[0]**power;dim=dimAdd(dim,u[1],power);pos=re.lastIndex;
      if(pos<compact.length){const op=compact[pos++];if(op!=='*'&&op!=='/')throw Error('Use * and / between unit symbols.');sign=op==='/'?-1:1;if(pos===compact.length)throw Error('Incomplete unit.');}
    }
    return {scale,dim};
  }
  function dimension(dim){return dim.map((p,i)=>p?['m','kg','s','A','K','mol','cd'][i]+(p===1?'':'^'+p):'').filter(Boolean).join(' * ')||'1';}
  function parse(text) {
    if(typeof text!=='string'||text.length>500)throw Error('Expression must be at most 500 characters.');
    const tokens=[];const re=/\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z][A-Za-z0-9_]*)|([+*/^(),-]))/y;
    let pos=0;
    while(pos<text.length){if(!text.slice(pos).trim())break;re.lastIndex=pos;const m=re.exec(text);if(!m)throw Error('Unexpected character near '+text.slice(pos,pos+12));tokens.push(m[1]?{n:Number(m[1])}:m[2]??m[3]);pos=re.lastIndex;if(tokens.length>200)throw Error('Expression is too complex.');}
    let i=0;const is=x=>tokens[i]===x;const eat=x=>{if(!is(x))throw Error('Expected '+x);i++;};
    function expr(){let n=term();while(is('+')||is('-')){const op=tokens[i++];n={op,a:n,b:term()};}return n;}
    function term(){let n=unary();while(is('*')||is('/')){const op=tokens[i++];n={op,a:n,b:unary()};}return n;}
    function unary(){if(is('-')||is('+')){const op=tokens[i++];return op==='-'?{op:'neg',a:unary()}:unary();}return power();}
    function power(){let n=primary();if(is('^')){i++;n={op:'^',a:n,b:unary()};}return n;}
    function primary(){const t=tokens[i++];if(t===undefined)throw Error('Incomplete expression.');if(typeof t==='object')return {op:'number',value:finite(t.n,'Constant')};if(t==='('){const n=expr();eat(')');return n;}if(typeof t==='string'&&/^[A-Za-z]/.test(t)){if(is('(')){i++;if(!['sqrt','sin','cos','exp','log'].includes(t))throw Error('Unknown function '+t);const n=expr();eat(')');return {op:t,a:n};}return t==='pi'?{op:'number',value:Math.PI}:{op:'variable',name:t};}throw Error('Unexpected token '+t);}
    const ast=expr();if(i!==tokens.length)throw Error('Unexpected token '+String(tokens[i]));return ast;
  }
  function compile(config) {
    if(!config||typeof config!=='object')throw Error('Model must be an object.');
    if(!Array.isArray(config.variables)||config.variables.length<1||config.variables.length>12)throw Error('Use 1 to 12 variables.');
    const names=new Map();
    const vars=config.variables.map((v,i)=>{
      if(!v||typeof v.name!=='string'||!/^[A-Za-z][A-Za-z0-9_]{0,19}$/.test(v.name)||['pi','sin','cos','log','exp','sqrt'].includes(v.name)||names.has(v.name))throw Error('Variable names must be unique identifiers, excluding function names and pi.');
      names.set(v.name,i);const u=unit(v.unit),value=finite(v.value,v.name),sigma=finite(v.sigma,v.name+' independent sigma');if(sigma<0)throw Error('Standard uncertainties cannot be negative.');
      return {...v,u,valueSI:finite(value*u.scale,'Converted value'),sigmaSI:finite(sigma*u.scale,'Converted sigma')};
    });
    const sourceInput=config.sources??[];if(!Array.isArray(sourceInput)||sourceInput.length>12)throw Error('Use at most 12 shared sources.');
    const sourceNames=new Set();
    const sources=sourceInput.map(s=>{
      if(!s||typeof s.name!=='string'||!s.name.trim()||s.name.length>60||sourceNames.has(s.name))throw Error('Shared source names must be nonempty and unique.');sourceNames.add(s.name);
      const u=unit(s.unit),sigma=finite(s.sigma,'Source sigma');if(sigma<0)throw Error('Source uncertainty cannot be negative.');
      if(!s.weights||typeof s.weights!=='object'||Array.isArray(s.weights))throw Error('Source weights must map variable names to coefficients.');
      const impacts=vars.map(()=>0);
      for(const [name,weight] of Object.entries(s.weights)){if(!names.has(name))throw Error('Unknown source variable '+name);const i=names.get(name);if(!same(u.dim,vars[i].u.dim))throw Error('Source '+s.name+' and '+name+' have incompatible units.');impacts[i]=finite(finite(weight,'Source weight')*sigma*u.scale,'Source impact');}
      return {...s,impacts};
    });
    const ast=parse(config.expression),n=vars.length;
    function evaluate(node,values,gradient=true){
      const z=()=>Array(n).fill(0);const make=(value,dim,g)=>({value:finite(value,'Expression result'),dim,g});
      if(node.op==='number')return make(node.value,ZERO,z());
      if(node.op==='variable'){if(!names.has(node.name))throw Error('Unknown variable '+node.name);let g=z(),j=names.get(node.name);if(gradient)g[j]=1;return make(values[j],vars[j].u.dim,g);}
      const a=evaluate(node.a,values,gradient);
      if(node.op==='neg')return make(-a.value,a.dim,a.g.map(v=>-v));
      if(node.b){const b=evaluate(node.b,values,gradient);let value,dim,da,db;
        if(node.op==='+'||node.op==='-'){if(!same(a.dim,b.dim))throw Error('Cannot add/subtract incompatible dimensions ('+dimension(a.dim)+' and '+dimension(b.dim)+').');let k=node.op==='+'?1:-1;value=a.value+k*b.value;dim=a.dim;da=1;db=k;}
        else if(node.op==='*'){value=a.value*b.value;dim=dimAdd(a.dim,b.dim);da=b.value;db=a.value;}
        else if(node.op==='/'){if(b.value===0)throw Error('Division by zero.');value=a.value/b.value;dim=dimAdd(a.dim,b.dim,-1);da=1/b.value;db=-a.value/b.value**2;}
        else {if(!same(b.dim,ZERO)||hasVariable(node.b)||!Number.isInteger(b.value)||Math.abs(b.value)>12)throw Error('Powers must be constant integers between -12 and 12.');if(a.value===0&&b.value<0)throw Error('Zero raised to a negative power.');value=a.value**b.value;dim=a.dim.map(v=>v*b.value);da=b.value===0?0:b.value*a.value**(b.value-1);db=0;}
        return make(value,dim,a.g.map((v,i)=>gradient?finite(da*v+db*b.g[i],'Derivative'):0));
      }
      let value,da,dim=ZERO;
      if(node.op==='sqrt'){if(a.value<=0)throw Error('sqrt requires a positive value (zero has a singular derivative).');value=Math.sqrt(a.value);da=.5/value;dim=a.dim.map(v=>v/2);}
      else {if(!same(a.dim,ZERO))throw Error(node.op+' requires a dimensionless argument.');if(node.op==='sin'){value=Math.sin(a.value);da=Math.cos(a.value);}if(node.op==='cos'){value=Math.cos(a.value);da=-Math.sin(a.value);}if(node.op==='exp'){value=Math.exp(a.value);da=value;}if(node.op==='log'){if(a.value<=0)throw Error('log requires a positive value.');value=Math.log(a.value);da=1/a.value;}}
      return make(value,dim,a.g.map(v=>gradient?finite(v*da,'Derivative'):0));
    }
    function hasVariable(t){return t.op==='variable'||(t.a&&hasVariable(t.a))||(t.b&&hasVariable(t.b));}
    const center=vars.map(v=>v.valueSI),result=evaluate(ast,center);
    const output=config.output_unit?unit(config.output_unit):{scale:1,dim:result.dim};
    if(!same(output.dim,result.dim))throw Error('Output unit does not match expression: '+dimension(result.dim));
    // Independent latent errors guarantee a positive semidefinite covariance matrix.
    const groups=vars.map((v,i)=>({name:v.name+' independent',impact:vars.map((_,j)=>i===j?v.sigmaSI:0)})).concat(sources.map(s=>({name:s.name,impact:s.impacts})));
    const covariance=vars.map((_,i)=>vars.map((_,j)=>groups.reduce((a,s)=>a+s.impact[i]*s.impact[j],0)));
    if(covariance.flat().some(v=>!Number.isFinite(v)))throw Error('Uncertainty magnitudes overflow.');
    const contributions=groups.map(s=>{const sensitivity=s.impact.reduce((sum,v,i)=>sum+v*result.g[i],0)/output.scale;return {name:s.name,signedEffect:sensitivity,variance:sensitivity**2};});
    const variance=finite(contributions.reduce((s,c)=>s+c.variance,0),'Output variance');
    const independentVariance=result.g.reduce((s,g,i)=>s+g*g*covariance[i][i],0)/output.scale**2;
    return {vars,sources,groups,covariance,contributions,value:result.value/output.scale,sigma:Math.sqrt(variance),independentSigma:Math.sqrt(independentVariance),gradient:result.g,dimension:dimension(result.dim),unit:config.output_unit||dimension(result.dim),variance,center,output,evaluate:values=>evaluate(ast,values,false).value/output.scale};
  }
  function normalGenerator(seed){let state=seed>>>0,spare=null;function random(){state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}return ()=>{if(spare!==null){const x=spare;spare=null;return x;}const radius=Math.sqrt(-2*Math.log(Math.max(random(),1e-15))),angle=2*Math.PI*random();spare=radius*Math.sin(angle);return radius*Math.cos(angle);};}
  function simulate(model,draws=6000,seed=42){
    if(!Number.isInteger(draws)||draws<100||draws>20000)throw Error('Use 100 to 20000 Monte Carlo draws.');if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Seed must be an unsigned 32-bit integer.');
    const normal=normalGenerator(seed),samples=[];let rejected=0,mean=0,m2=0;
    for(let d=0;d<draws;d++){const values=model.center.slice();for(const g of model.groups){const e=normal();for(let i=0;i<values.length;i++)values[i]+=e*g.impact[i];}let y;try{y=model.evaluate(values);}catch{rejected++;continue;}samples.push(y);const delta=y-mean;mean+=delta/samples.length;m2+=delta*(y-mean);}
    samples.sort((a,b)=>a-b);const quantile=p=>{if(!samples.length)return null;const x=(samples.length-1)*p,i=Math.floor(x);return samples[i]+(samples[Math.min(i+1,samples.length-1)]-samples[i])*(x-i);};
    return {draws,seed,accepted:samples.length,rejected,mean:samples.length?mean:null,sigma:samples.length>1?Math.sqrt(m2/(samples.length-1)):null,q025:quantile(.025),q975:quantile(.975),samples};
  }
  return {unit,dimension,parse,compile,simulate};
});
