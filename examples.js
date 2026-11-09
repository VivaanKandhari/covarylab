(function(root){
  const examples={
    ruler:{title:'One ruler, two readings',description:'A shared ruler zero offset cancels in a difference. Treating the two readings as independent misses that cancellation. All values are fictional teaching fixtures.',expression:'b - a',output_unit:'cm',variables:[{name:'a',value:10,unit:'cm',sigma:.03},{name:'b',value:24,unit:'cm',sigma:.03}],sources:[{name:'Ruler zero offset',unit:'cm',sigma:.2,weights:{a:1,b:1}}]},
    pendulum:{title:'Pendulum gravity estimate',description:'A fictional pendulum lab combines a length reading and a timing reading. Compare which uncertainty source would benefit most from better measurement. No experimental finding is claimed.',expression:'4 * pi^2 * L / T^2',output_unit:'m/s^2',variables:[{name:'L',value:75,unit:'cm',sigma:.2},{name:'T',value:1.74,unit:'s',sigma:.025}],sources:[{name:'Length calibration',unit:'cm',sigma:.1,weights:{L:1}}]},
    temperature:{title:'A curved response',description:'Dimensionless simulated sensor response. A wide input uncertainty makes the first-order approximation less representative. Monte Carlo uses the specified normal input model, not observed data.',expression:'exp(x)',output_unit:'1',variables:[{name:'x',value:1,unit:'1',sigma:.65}],sources:[]}
  };
  if(typeof module==='object'&&module.exports)module.exports=examples;else root.LabExamples=examples;
})(typeof globalThis==='object'?globalThis:this);
