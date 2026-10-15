const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { mkdtempSync, rmSync, mkdirSync, writeFileSync, symlinkSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const output = mkdtempSync(path.join(tmpdir(), 'aria-layout-'))
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/lib/device.ts', 'src/lib/exportSite.ts', 'src/lib/buildTemplate.ts', 'src/data/templates.ts', '--outDir', output, '--module', 'commonjs', '--target', 'es2023', '--skipLibCheck', '--ignoreConfig'])
const { autoLayout, autoLayoutHeight, effectiveGeo, scaleComposition, responsiveComposition } = require(path.join(output, 'lib/device.js'))
const { buildSiteElements } = require(path.join(output, 'lib/buildTemplate.js'))
const { exportSite } = require(path.join(output, 'lib/exportSite.js'))
const { templates } = require(path.join(output, 'data/templates.js'))
after(() => rmSync(output, { recursive: true, force: true }))
const near = (a, b) => assert.ok(Math.abs(a-b) < 0.00001, `${a} differs from ${b}`)
const sample = (extra = {}) => ({id:'a', pageId:'p', x:40, y:30, width:200, height:100, rotation:0, kind:'text',content:'A heading',style:{},...extra})

test('phone layout stacks columns and keeps text readable', () => {
  const elems = [sample({kind:'heading',x:40,width:400,height:120,content:'A clear direction',style:{fontSize:48,lineHeight:1.1}}),sample({id:'b',kind:'svg',x:520,width:350,height:300})]
  const map = autoLayout(elems,'mobile',960)
  assert.ok(map.b.y >= map.a.y+map.a.height)
  assert.ok(map.a.fontScale*48 >= 26)
  near(map.b.width/map.b.height,350/300)
})
test('all templates fit narrow frames and leave authored data unchanged', () => {
  for (const tpl of templates) {
    const elems = buildSiteElements({style:tpl.style,sections:tpl.sections,siteName:tpl.name,tagline:tpl.tagline,blurb:tpl.blurb}).map((e,i)=>({...e,id:String(i),pageId:'p'}))
    const before = JSON.stringify(elems)
    for (const width of [320,390,540,768]) {
      const map = responsiveComposition(elems,width,960)
      assert.equal(Object.keys(map).length,elems.length,tpl.name)
      for (const el of elems) {
        const g=map[el.id]
        assert.ok(g.x>=0 && g.x+g.width<=width+.01,tpl.name+' '+el.name)
        assert.ok(g.height>0 && g.fontScale>0)
      }
    }
    assert.equal(JSON.stringify(elems),before)
  }
})
test('background panels grow with their text and buttons', () => {
  const elems=[sample({kind:'rectangle',x:0,y:0,width:960,height:300}),sample({id:'b',x:40,y:50,width:400,height:100,content:'A paragraph with room to breathe.',style:{fontSize:20}})]
  const map=responsiveComposition(elems,390,960)
  assert.ok(map.a.height>=map.b.y+map.b.height)
  assert.ok(map.b.x>map.a.x)
})
test('fits negative coordinates and rotated horizontal extents', () => {
  const el = sample({x:-80,y:-20,rotation:45})
  const g = scaleComposition([el],390,960).a
  const halfW = (Math.abs(el.width*Math.cos(Math.PI/4))+Math.abs(el.height*Math.sin(Math.PI/4)))*g.fontScale/2
  assert.ok(g.x+g.width/2-halfW >= -0.00001)
  assert.ok(g.x+g.width/2+halfW <= 390)
  assert.ok(g.y >= 0)
})
test('manual device overrides and desktop geometry stay intact', () => {
  const el = sample({mobile:{x:12,y:20,width:300,height:60}})
  assert.deepEqual(effectiveGeo(el,'mobile',false,960),{x:12,y:20,width:300,height:60,fontScale:1})
  assert.deepEqual(effectiveGeo(el,'desktop',true,960),{x:40,y:30,width:200,height:100,fontScale:1})
})
test('empty and zero-width designs do not produce invalid geometry', () => {
  assert.deepEqual(autoLayout([],'mobile',0),{})
  assert.equal(autoLayoutHeight({}),0)
  assert.ok(Object.values(autoLayout([sample()],'mobile',0).a).every(Number.isFinite))
})
test('downloaded runtime uses exactly the editor geometry and builds', () => {
  const design = {name:'Layout verification',frame:{width:960,height:720,background:'#fff'},pages:[{id:'p',name:'Home'}],elements:[sample(),sample({id:'b',y:300})],effects:[],autoAdaptive:true}
  const files = exportSite(design)
  const runtime = files['src/runtime.jsx']
  const start = runtime.indexOf('const responsiveComposition = ')
  const end = runtime.indexOf('function Element(')
  const source = runtime.slice(start,end).replace('export function autoLayout','function autoLayout')
  const ctx = {DEVICE_FRAMES:{mobile:{width:390},tablet:{width:768}},elems:design.elements}
  vm.createContext(ctx)
  const actual = vm.runInContext(source+';autoLayout(elems,"mobile",960)',ctx)
  assert.equal(JSON.stringify(actual),JSON.stringify(autoLayout(design.elements,'mobile',960)))
  const project = path.join(output,'export')
  mkdirSync(project)
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(project,file)),{recursive:true})
    writeFileSync(path.join(project,file),contents)
  }
  symlinkSync(path.resolve('node_modules'),path.join(project,'node_modules'),'dir')
  execFileSync(process.execPath,[path.resolve('node_modules/vite/bin/vite.js'),'build'],{cwd:project,stdio:'pipe'})
})
