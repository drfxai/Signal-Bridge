// EA ReportSeries supplies up to 14 daily broker P/L buckets, independently of the KPI range.
// Zero is the cumulative chart baseline, not the account balance.
export function performanceGeometry(series){
 if(!Array.isArray(series)||!series.length||!series.every(Number.isFinite))return null;
 let total=0;const values=[0,...series.map(value=>total+=value)];
 if(!values.every(Number.isFinite))return null;
 const low=Math.min(0,...values),high=Math.max(0,...values),span=high-low||1;
 const y=v=>Number((105-(v-low)/span*90).toFixed(2));
 const points=values.map((value,i)=>[Number((8+i/(values.length-1)*584).toFixed(2)),y(value)]);
 const path=points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
 return {path,area:path+' L592 '+y(0)+' L8 '+y(0)+' Z',zero:y(0),last:y(total),total,count:series.length};
}
