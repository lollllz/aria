import { studioIconSvg } from './studioIcons'
import type { ElementStyle, TemplateStyle } from '../types'
import type { ElementSeed } from './buildTemplate'

// Original vector artwork stays bundled and available offline.
const art = (body: string, bg: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360"><rect width="400" height="360" fill="${bg}"/>${body}</svg>`
export function buildTemplateLayout(st: TemplateStyle, name: string, tagline: string): ElementSeed[] {
  const els: ElementSeed[] = []
  const base: ElementStyle = {background:'transparent', color:st.text,fontSize:16,fontWeight:400,radius:0,borderWidth:0,borderColor:st.muted,opacity:1,textAlign:'left',padding:0,shadow:false,letterSpacing:0,lineHeight:1.08,animation:'none',animDuration:1.8,animIntensity:1,glowColor:st.accent,fontFamily:st.bodyFont}
  const add = (kind: ElementSeed['kind'], content:string,x:number,y:number,width:number,height:number,style:Partial<ElementStyle>={}, label=content) => els.push({kind,content,x,y,width,height,rotation:0,name:label || 'Shape',action:{type:'none',target:''},style:{...base,...style}})
  const text=(content:string,x:number,y:number,w:number,h:number,size=16,style:Partial<ElementStyle>={})=>{
    const hasArrow = content.includes('↗')
    const label = content.replace('↗', '').trim()
    add('text',label,x,y,hasArrow && style.textAlign === 'right' ? w-20 : w,h,{fontSize:size,...style})
    if (hasArrow) add('svg',studioIconSvg('arrow',style.color || st.text),style.textAlign === 'right' ? x+w-12 : x+Math.min(w-14,label.length*size*.58+8),y+1,12,12,{},'Arrow')
  }
  const heading=(content:string,x:number,y:number,w:number,h:number,size:number,style:Partial<ElementStyle>={})=>add('heading',content,x,y,w,h,{fontFamily:st.headingFont,fontSize:size,letterSpacing:-2,...style})
  const rect=(x:number,y:number,w:number,h:number,color:string)=>add('rectangle','',x,y,w,h,{background:color},'Colour field')
  const rule=(y:number)=>rect(36,y,888,1,st.muted)
  const cta=(label:string,x:number,y:number,w=170,color=st.accent,ink=st.bg)=>{
    const caption = label.replace('↗','').trim()
    add('button',caption,x,y,w,44,{background:color,color:ink,fontSize:13,fontWeight:600,padding:12,textAlign:'left'},caption)
    add('svg',studioIconSvg('arrow',ink),x+w-24,y+16,12,12,{},'Button arrow')
  }
  const svg=(body:string,bg:string,x:number,y:number,w:number,h:number,label:string)=>add('svg',art(body,bg),x,y,w,h,{},label)
  text(name,36,25,300,35,23,{fontWeight:700})
  text('ABOUT     WORK     CONTACT ↗',610,32,314,24,11,{textAlign:'right',letterSpacing:1})
  rule(76)
  switch(st.layout){
    case 'nova':
      text('NOVA / INDEPENDENT STRATEGY PARTNERS',36,106,640,20,11,{color:st.accent,letterSpacing:1.5})
      heading(tagline,36,153,530,205,62,{fontWeight:600})
      text('Clarity in a changing world. We help ambitious teams turn their next chapter into their strongest.',40,362,390,70,18,{color:st.muted,lineHeight:1.5})
      cta('Meet your next chapter ↗',40,465,208)
      svg(`<path d="M40 320V110L200 20l160 90v210H40" fill="${st.accent}"/><path d="M200 20v300M40 110l160 85 160-85M200 195v125" fill="none" stroke="#f4f0df" stroke-width="2"/><path d="M80 320V160l80 45v115M240 320V205l80-45v160" fill="#f0ebda"/><circle cx="310" cy="45" r="22" fill="#eea46d"/>`,st.surface,574,119,350,388,'Architectural study')
      rule(555);text('A CLEARER WAY FORWARD',36,581,240,24,11,{letterSpacing:1})
      ;['01  Discover the opportunity','02  Define the direction','03  Make the change'].forEach((t,i)=>text(t,36+i*302,632,285,30,17))
      break
    case 'folio':
      text('ART DIRECTION / DIGITAL EXPERIENCES',36,101,600,20,11,{letterSpacing:1})
      heading(tagline,30,137,760,190,96,{fontWeight:900,lineHeight:.95})
      add('ellipse','',810,150,110,110,{background:st.accent},'Signature dot')
      rect(36,336,570,267,st.accent)
      svg('<circle cx="200" cy="180" r="130" fill="#f5d9b5"/><path d="M80 250L200 50l120 200Z" fill="#29352c"/><circle cx="200" cy="204" r="60" fill="#f4f0e4"/>',st.accent,82,336,450,267,'Project 01 — Counterform')
      rect(626,336,298,267,'#c6cdf0');heading('Aa',656,351,250,170,140,{color:'#262b40',fontFamily:'Georgia, serif'});text('TYPE AS AN ATTITUDE.',650,550,250,22,11,{color:'#262b40',letterSpacing:1})
      text('01 / Counterform — Brand identity',36,621,570,30,13);text('02 / Letter studies — Typography',626,621,298,30,13)
      text('AVAILABLE FOR SELECT COLLABORATIONS ↗',36,681,700,20,11,{color:st.accent,letterSpacing:1})
      break
    case 'launchpad':
      text('A CALMER PLACE TO DO YOUR BEST WORK',36,103,700,20,11,{color:st.accent,letterSpacing:1.5})
      heading(tagline,36,144,490,200,82,{color:st.accent,fontWeight:700})
      text('Bring your notes, projects and scattered thoughts into one beautifully focused workspace.',40,370,350,80,18,{color:st.muted,lineHeight:1.5})
      cta('Find your focus ↗',40,478,180,st.accent,'#171c18')
      rect(485,145,439,390,st.surface);rect(485,145,439,43,st.accent);text('↗  YOUR WEEK, IN VIEW',505,160,380,20,12,{color:'#171c18',fontWeight:700});text('Monday, a fresh start.',510,219,370,60,32,{fontWeight:600});
      ;['Write the first draft','Make space to think','Ship something good'].forEach((t,i)=>{rect(510,305+i*62,388,45,st.bg);add('ellipse','',527,321+i*62,12,12,{borderWidth:1,borderColor:st.muted},'Task status');text(t,550,319+i*62,326,25,15)})
      rule(581);text('DO LESS. MAKE IT COUNT.',36,610,650,50,37,{fontWeight:700});text('Notes / Projects / A little breathing room',36,675,650,24,13,{color:st.muted})
      break
    case 'saffron':
      rect(0,77,420,643,st.accent);text('SEASONAL COOKING · GOOD COMPANY',36,106,350,30,10,{color:'#fff1da',letterSpacing:1});heading(tagline,36,174,350,225,73,{color:'#fff1da',fontFamily:st.headingFont});text('Long lunches. Another glass. The kind of evening you wish would last a little longer.',38,441,320,84,18,{color:'#fff1da',lineHeight:1.5});cta('Come on over ↗',38,579,190,'#f6eedc',st.accent)
      svg('<circle cx="200" cy="178" r="144" fill="#e4d6b6"/><circle cx="200" cy="178" r="124" fill="none" stroke="#8e3323" stroke-width="3"/><circle cx="200" cy="178" r="103" fill="#faf5e6"/><path d="M135 190q20-90 80-63t60 73q-80 70-140-10" fill="#496143"/><ellipse cx="200" cy="177" rx="49" ry="32" fill="#dd8b40"/><circle cx="190" cy="164" r="14" fill="#a8462e"/><path d="M31 50v230M19 50v65h24V50M370 50v230" stroke="#756852" stroke-width="5" fill="none"/>',st.bg,445,99,490,397,'House special — illustrated table setting')
      text('AT THE TABLE',460,512,440,24,11,{letterSpacing:2,color:st.accent});text('Burrata, late tomatoes, basil',460,552,440,28,21,{fontFamily:st.headingFont});text('Handmade pasta, slow Sunday ragù',460,594,440,28,21,{fontFamily:st.headingFont});text('Tuesday–Sunday  /  12:00 until late',460,665,440,24,12,{color:st.muted})
      break
    case 'ink':
      heading(name,36,91,888,112,96,{textAlign:'center',fontFamily:st.headingFont});rule(212);text('VOL. 01  /  IDEAS WORTH SPENDING TIME WITH',36,229,700,22,11,{letterSpacing:1});text('THE SUNDAY EDITION',700,229,224,22,10,{textAlign:'right'});
      svg('<circle cx="230" cy="155" r="112" fill="#bca783"/><path d="M0 360L70 170l85 100 90-180 155 270" fill="#314c3c"/><path d="M0 360l180-120 220 120" fill="#9eae8c"/><path d="M0 321l400-105" stroke="#f1e7d2" stroke-width="8"/>','#e7dfcb',36,281,450,300,'The landscape of attention')
      text('CULTURE / 8 MIN READ',516,286,408,24,10,{letterSpacing:1,color:st.accent});heading(tagline,516,328,408,149,50,{fontFamily:st.headingFont});text('On paying attention, taking the long way home, and finding more in the everyday.',516,495,390,65,16,{color:st.muted,lineHeight:1.5});text('Read the story ↗',516,588,380,26,14,{color:st.accent});rule(633);text('IN THIS ISSUE',36,659,200,25,11,{letterSpacing:1});text('01  The art of noticing',275,658,300,28,16);text('02  A slower kind of city',625,658,300,28,16)
      break
    case 'atlas':
      heading(tagline,30,111,890,200,95,{fontWeight:900,color:st.accent,lineHeight:.94});text('INDEPENDENT THINKING. COLLECTIVE ENERGY.',36,326,600,25,12,{letterSpacing:1});text('We make identities, campaigns and digital experiences for brands with something to say.',600,326,324,70,16,{color:st.muted,lineHeight:1.4});
      rect(36,434,888,218,st.accent);heading('MAKE',65,453,465,155,125,{color:'#24211f',fontWeight:900});svg('<path d="M200 10l30 100 100-70-70 105 125 35-125 35 70 105-100-70-30 100-30-100-100 70 70-105-125-35 125-35L70 40l100 70Z" fill="#24211f"/>',st.accent,590,434,310,218,'Campaign star');text('SELECTED WORK / 2026',36,677,500,23,12,{letterSpacing:1});text('New perspectives ↗',700,677,224,23,12,{textAlign:'right'})
      break
  }
  return els
}
