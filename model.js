/* Futbol Pitch Boynton - interactive space plan
   BC Commerce Center, Building A, Suite 650, 8255 Boynton Beach Blvd
   Butters Construction and Development. Schematic only, not for construction.

   Coordinate system: feet. Origin at the northwest interior corner.
   x runs east across the bay width. z runs south from the front wall
   toward the truck court. y is up.

   Two kinds of program:
     LOCKED   the wet core and the entry. Tied to the sanitary stub and the
              storefront, so these never move.
     ROOMS    dry party rooms. The tenant can put these anywhere in the suite.
              They carry their own four walls, so the partitions follow. */

window.FPB = (function () {
'use strict';

/* ---------------------------------------------------------------- shell */

var SHELL = {
  w: 69.5,        // interior clear width  (69'-6" bay)
  d: 191.5,       // interior clear depth  (192'-6" less wall thickness)
  clear: 32       // clear height to deck
};

var CUT = 11;     // cutaway wall height
var WALLT = 0.67; // wall thickness
var ROOMH = 10;   // interior partition height

/* One uniform strip along the north wall, 10 feet deep, tiling the full
   69'-6" of the bay. Nothing steps down into the floor, so however the party
   rooms get dragged there is no leftover corner. */

var LOCKED = [
  { id:'entry',  name:'Entry and Viewing', short:'ENTRY',  x:0,    z:0,  w:35.5, d:15, kind:'tile',   col:'#C9D6C4' },
  { id:'office', name:'Office',            short:'OFFICE', x:35.5, z:0,  w:10,   d:10, kind:'carpet', col:'#B9A0D6' },
  { id:'stor',   name:'Storage',           short:'STOR',   x:45.5, z:0,  w:10,   d:10, kind:'seal',   col:'#9AA5A0' },
  { id:'wcA',    name:'Changing Room A',   short:'WC/SH',  x:55.5, z:0,  w:7,    d:10, kind:'tile',   col:'#8FA9C4' },
  { id:'wcB',    name:'Changing Room B',   short:'WC/SH',  x:62.5, z:0,  w:7,    d:10, kind:'tile',   col:'#8FA9C4' },
  { id:'hall',   name:'Back of House',     short:'HALL',   x:35.5, z:10, w:34,   d:5,  kind:'tile',   col:'#C9D6C4', circ:true }
];

/* Partitions inside the locked cluster. Fixed because the rooms they bound
   are fixed. Party rooms carry their own walls and are not in this list. */

/* Every back of house room opens onto the corridor, and the corridor opens
   to the lobby at one end and to the floor at the other. Nothing is reached
   by walking through anything else. */

var LOCKED_WALLS = [
  [0,    15, 35.5, 15, 0.18, 10],   // lobby to the open floor
  [35.5, 0,  35.5, 10, null, 0],    // lobby / office, corridor mouth left open
  [45.5, 0,  45.5, 10, null, 0],    // office / storage
  [55.5, 0,  55.5, 10, null, 0],    // storage / changing A
  [62.5, 0,  62.5, 10, null, 0],    // changing A / changing B
  [35.5, 10, 45.5, 10, 0.50, 3.0],  // office door
  [45.5, 10, 55.5, 10, 0.50, 3.0],  // storage door
  [55.5, 10, 62.5, 10, 0.50, 3.0],  // changing A door
  [62.5, 10, 69.5, 10, 0.50, 3.0],  // changing B door
  [35.5, 15, 69.5, 15, 0.87, 5]     // corridor to the floor, by the changing rooms
];

var DEFAULT_ROOMS = [
  { id:'partyA', name:'Party Room A', x:8,  z:21, w:22, d:21 },
  { id:'partyB', name:'Party Room B', x:36, z:21, w:22, d:21 }
];

var DEFAULT_FIELDS = [
  { id:'p1', name:'Pitch 1', x:6, z:48,  w:57, d:64 },
  { id:'p2', name:'Pitch 2', x:6, z:119, w:57, d:64 }
];

var ENTRY = LOCKED[0];

/* -------------------------------------------------------------- palette */

var C = {
  slab:0x8d8f88, wall:0xe6e9e2, wallIn:0xd3d8cf,
  steel:0x59605c, deck:0x4a524d, cone:0xff6b2c, glass:0x9fc6d8
};

var ROOMCOL = [0xFFB03A, 0xFF8A3A];

/* -------------------------------------------------------------- runtime */

var scene, camera, renderer, stage;
var staticGroup, fieldGroup, roomGroup, peopleGroup;
var extWalls = [], duskLights = [], dayLights = [];
var fields = clone(DEFAULT_FIELDS);
var rooms  = clone(DEFAULT_ROOMS);
var tagHost = null, tagItems = [], TAGS = [];
var running = false;

var orb = { tx:SHELL.w/2, ty:0, tz:SHELL.d/2, dist:238, yaw:-Math.PI/2, pit:1.05,
            gx:SHELL.w/2, gy:0, gz:SHELL.d/2, gdist:300, gyaw:-Math.PI/2, gpit:1.05 };

var walk = { on:false, x:11, z:10, yaw:0.35, pit:0,
             vx:0, vz:0, keys:{}, eye:5.6, stick:{ active:false, dx:0, dy:0 } };

var onModeChange = null;

function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* ------------------------------------------------------------- textures */

function turfTexture(w, d){
  var s = 8;
  var cw = Math.max(64, Math.round(w * s));
  var ch = Math.max(64, Math.round(d * s));
  var cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  var g = cv.getContext('2d');

  g.fillStyle = '#2f7d4f';
  g.fillRect(0, 0, cw, ch);

  var bands = 10, bh = ch / bands;
  for (var i = 0; i < bands; i++){
    g.fillStyle = (i % 2) ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)';
    g.fillRect(0, i * bh, cw, bh);
  }

  var grd = g.createLinearGradient(0, 0, 0, ch);
  grd.addColorStop(0, 'rgba(120,110,70,0.16)');
  grd.addColorStop(0.16, 'rgba(120,110,70,0)');
  grd.addColorStop(0.84, 'rgba(120,110,70,0)');
  grd.addColorStop(1, 'rgba(120,110,70,0.16)');
  g.fillStyle = grd; g.fillRect(0, 0, cw, ch);

  var lw = Math.max(2, 0.34 * s);
  g.strokeStyle = 'rgba(244,247,240,0.86)';
  g.fillStyle = 'rgba(244,247,240,0.86)';
  g.lineWidth = lw;

  var m = 2.5 * s;
  g.strokeRect(m, m, cw - 2*m, ch - 2*m);

  g.beginPath(); g.moveTo(m, ch/2); g.lineTo(cw - m, ch/2); g.stroke();
  var rad = Math.min((cw - 2*m) * 0.18, (ch - 2*m) * 0.16);
  g.beginPath(); g.arc(cw/2, ch/2, rad, 0, Math.PI*2); g.stroke();
  g.beginPath(); g.arc(cw/2, ch/2, lw*1.1, 0, Math.PI*2); g.fill();

  var paW = Math.min((cw - 2*m) * 0.52, (cw - 2*m) - 4*s);
  var paD = Math.min((ch - 2*m) * 0.17, 20 * s);
  [0, 1].forEach(function (end){
    var y0 = end ? ch - m - paD : m;
    g.strokeRect((cw - paW)/2, y0, paW, paD);
    var gaW = paW * 0.44, gaD = paD * 0.42;
    var y1 = end ? ch - m - gaD : m;
    g.strokeRect((cw - gaW)/2, y1, gaW, gaD);
    var spot = end ? ch - m - paD * 0.72 : m + paD * 0.72;
    g.beginPath(); g.arc(cw/2, spot, lw*1.1, 0, Math.PI*2); g.fill();
  });

  var ca = 1.2 * s;
  [[m,m,0,Math.PI/2],[cw-m,m,Math.PI/2,Math.PI],
   [cw-m,ch-m,Math.PI,Math.PI*1.5],[m,ch-m,Math.PI*1.5,Math.PI*2]]
   .forEach(function(a){ g.beginPath(); g.arc(a[0],a[1],ca,a[2],a[3]); g.stroke(); });

  var t = new THREE.CanvasTexture(cv);
  t.anisotropy = 8;
  return t;
}

var netTex = null;
function netTexture(){
  if (netTex) return netTex;
  var cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  var g = cv.getContext('2d');
  g.clearRect(0,0,64,64);
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.lineWidth = 2.4;
  for (var i = -64; i < 128; i += 16){
    g.beginPath(); g.moveTo(i,0); g.lineTo(i+64,64); g.stroke();
    g.beginPath(); g.moveTo(i,64); g.lineTo(i+64,0); g.stroke();
  }
  netTex = new THREE.CanvasTexture(cv);
  netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping;
  return netTex;
}

/* --------------------------------------------------------------- makers */

function box(w, h, d, m){ return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

function mat(color, opts){
  opts = opts || {};
  return new THREE.MeshLambertMaterial({
    color: color,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity !== undefined ? opts.opacity : 1,
    side: opts.side || THREE.FrontSide,
    map: opts.map || null,
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true
  });
}

function wallRun(x1, z1, x2, z2, h, m, door, dw){
  var g = new THREE.Group();
  var dx = x2 - x1, dz = z2 - z1;
  var len = Math.sqrt(dx*dx + dz*dz);
  if (len < 0.01) return g;
  var ang = Math.atan2(dx, dz);

  function seg(a, b){
    if (b - a < 0.05) return;
    var s = box(WALLT, h, b - a, m);
    s.position.set(0, h/2, (a + b)/2 - len/2);
    g.add(s);
  }

  if (door === undefined || door === null){
    seg(0, len);
  } else {
    var c = door * len, w = (dw || 3.5);
    seg(0, Math.max(0, c - w/2));
    seg(Math.min(len, c + w/2), len);
    if (h > 7.2){
      var hd = box(WALLT, h - 7, Math.min(w, len), m);
      hd.position.set(0, 7 + (h - 7)/2, c - len/2);
      g.add(hd);
    }
  }
  /* ang is measured from +z toward +x, and the segments are built along
     local z, so the run angle IS the rotation. Subtracting 90 degrees here
     threw every wall in the model perpendicular to its own run. */
  g.position.set((x1 + x2)/2, 0, (z1 + z2)/2);
  g.rotation.y = ang;
  return g;
}

function floorPad(x, z, w, d, color, y){
  var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color));
  m.rotation.x = -Math.PI/2;
  m.position.set(x + w/2, y || 0.03, z + d/2);
  return m;
}

function finish(kind){
  return kind === 'wood' ? 0xb08048
       : kind === 'tile' ? 0xd6dad2
       : kind === 'carpet' ? 0x6f7a86
       : 0x7c817a;
}

function person(color){
  var g = new THREE.Group();
  var legs = box(1.05, 2.7, 0.7, mat(0x33383a));
  legs.position.y = 1.35; g.add(legs);
  var torso = box(1.25, 2.1, 0.8, mat(color));
  torso.position.y = 3.5; g.add(torso);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mat(0xd9a889));
  head.position.y = 4.95; g.add(head);
  return g;
}

function goal(width, height, depth){
  var g = new THREE.Group();
  var frame = mat(0xf4f7f0);
  var r = 0.22;
  var post1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, height, 8), frame);
  post1.position.set(-width/2, height/2, 0);
  var post2 = post1.clone(); post2.position.x = width/2;
  var bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 8), frame);
  bar.rotation.z = Math.PI/2; bar.position.y = height;
  g.add(post1, post2, bar);

  var nt = netTexture().clone();
  nt.needsUpdate = true;
  nt.repeat.set(width/1.6, height/1.6);
  var nm = new THREE.MeshLambertMaterial({
    map: nt, transparent:true, opacity:0.9, side:THREE.DoubleSide,
    color:0xffffff, depthWrite:false, alphaTest:0.02
  });

  var back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), nm);
  back.position.set(0, height/2, -depth);
  var top = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), nm);
  top.rotation.x = Math.PI/2; top.position.set(0, height, -depth/2);
  var sideGeo = new THREE.PlaneGeometry(depth, height);
  var sL = new THREE.Mesh(sideGeo, nm);
  sL.rotation.y = Math.PI/2; sL.position.set(-width/2, height/2, -depth/2);
  var sR = sL.clone(); sR.position.x = width/2;
  g.add(back, top, sL, sR);
  return g;
}

/* --------------------------------------------------------- static build */

function buildShell(){
  var g = new THREE.Group();

  var slab = new THREE.Mesh(new THREE.PlaneGeometry(SHELL.w, SHELL.d), mat(C.slab));
  slab.rotation.x = -Math.PI/2;
  slab.position.set(SHELL.w/2, 0, SHELL.d/2);
  g.add(slab);

  var apron = new THREE.Mesh(new THREE.PlaneGeometry(SHELL.w + 90, SHELL.d + 90), mat(0x6d7269));
  apron.rotation.x = -Math.PI/2;
  apron.position.set(SHELL.w/2, -0.06, SHELL.d/2);
  g.add(apron);

  var em = mat(C.wall, { side: THREE.DoubleSide });
  var dm = mat(0xcdd3c8, { side: THREE.DoubleSide, opacity: 0.55 });
  [[0,0,SHELL.w,0,em],[0,SHELL.d,SHELL.w,SHELL.d,em],
   [0,0,0,SHELL.d,em],[SHELL.w,0,SHELL.w,SHELL.d,dm]].forEach(function (r){
    var w = wallRun(r[0], r[1], r[2], r[3], SHELL.clear, r[4]);
    w.traverse(function (o){ if (o.isMesh) extWalls.push(o); });
    g.add(w);
  });

  var deck = new THREE.Mesh(new THREE.PlaneGeometry(SHELL.w, SHELL.d), mat(C.deck, {side:THREE.DoubleSide}));
  deck.rotation.x = Math.PI/2;
  deck.position.set(SHELL.w/2, SHELL.clear + 0.4, SHELL.d/2);
  deck.name = 'deck'; extWalls.push(deck); g.add(deck);

  var jm = mat(C.steel);
  for (var z = 8; z < SHELL.d; z += 8){
    var j = box(SHELL.w, 0.5, 0.35, jm);
    j.position.set(SHELL.w/2, SHELL.clear - 0.4, z);
    j.name = 'deck'; extWalls.push(j); g.add(j);
  }

  var odw = 12, odh = 14;
  var od = box(odw, odh, 0.4, mat(0xb9bfb6));
  od.position.set(SHELL.w/2, odh/2, SHELL.d - 0.2);
  g.add(od);
  for (var i = 1; i < 8; i++){
    var rib = box(odw, 0.12, 0.5, mat(0x9aa199));
    rib.position.set(SHELL.w/2, i * (odh/8), SHELL.d - 0.15);
    g.add(rib);
  }

  var sf = box(22, 9, 0.3, mat(C.glass, {opacity:0.45}));
  sf.position.set(13, 4.6, 0.1);
  g.add(sf);

  return g;
}

function buildLocked(){
  var g = new THREE.Group();
  var wm = mat(C.wallIn, { side: THREE.DoubleSide });

  LOCKED.forEach(function (r){ g.add(floorPad(r.x, r.z, r.w, r.d, finish(r.kind))); });
  LOCKED_WALLS.forEach(function (p){ g.add(wallRun(p[0], p[1], p[2], p[3], ROOMH, wm, p[4], p[5])); });

  var desk = new THREE.Group();
  var top = box(11, 0.35, 2.6, mat(0x2f3a34)); top.position.y = 3.4;
  var base = box(10.4, 3.4, 2.2, mat(C.cone)); base.position.y = 1.7;
  desk.add(top, base);
  desk.position.set(16, 0, 10.5);
  g.add(desk);

  /* Each changing room: a 3'-0" transfer shower with a curb and glass panel,
     one water closet and one lavatory. */
  [55.5, 62.5].forEach(function (rx){
    var pan = box(3.4, 0.35, 3.4, mat(0xdfe6df));
    pan.position.set(rx + 2.2, 0.18, 2.2);
    var curb = box(3.4, 0.55, 0.3, mat(0xc9d2c8));
    curb.position.set(rx + 2.2, 0.28, 3.9);
    var glass = box(0.14, 6.6, 3.4, mat(0x9fc6d8, { opacity:0.42 }));
    glass.position.set(rx + 3.95, 3.3, 2.2);
    var head = box(0.5, 0.3, 0.5, mat(0xbfc7bd));
    head.position.set(rx + 2.2, 6.6, 1.0);

    var wc = box(1.5, 2.4, 2.3, mat(0xf2f5ef));
    wc.position.set(rx + 1.2, 1.2, 7.6);
    var lav = box(2.0, 2.6, 1.5, mat(0xe4e9e2));
    lav.position.set(rx + 5.4, 1.3, 8.4);
    g.add(pan, curb, glass, head, wc, lav);
  });
  return g;
}

function buildLights(){
  var g = new THREE.Group();
  var hm = mat(0xf6f8f2);
  for (var z = 16; z < SHELL.d; z += 24){
    for (var x = 17; x < SHELL.w; x += 24){
      var f = box(4, 0.4, 0.9, hm);
      f.position.set(x, SHELL.clear - 2.2, z);
      f.name = 'deck'; extWalls.push(f); g.add(f);
      var st = box(0.12, 2, 0.12, mat(C.steel));
      st.position.set(x, SHELL.clear - 1.2, z);
      st.name = 'deck'; extWalls.push(st); g.add(st);
    }
  }
  return g;
}

function buildPeople(){
  var g = new THREE.Group();
  var cols = [0xff6b2c, 0xffb03a, 0x4aa3df, 0xf4f7f0, 0x8e5cd0, 0x35c08a];
  var spots = [
    [8,6],[22,5],[30,11],[12,13],[40,5],
    [48,12.5],[60,12.5],[66,18],
    [14,30],[24,35],[42,30],[52,36],
    [SHELL.w/2-8,66],[SHELL.w/2+6,82],[SHELL.w/2-3,104],
    [SHELL.w/2-10,138],[SHELL.w/2+9,155],[SHELL.w/2+2,176]
  ];
  spots.forEach(function (s, i){
    var p = person(cols[i % cols.length]);
    p.position.set(s[0], 0, s[1]);
    p.rotation.y = (i * 1.31) % (Math.PI * 2);
    g.add(p);
  });
  return g;
}

/* -------------------------------------------------------- dynamic build */

function disposeGroup(g){
  g.traverse(function (o){
    if (o.isMesh){
      if (o.geometry) o.geometry.dispose();
      if (o.material){
        if (o.material.map && o.material.map.dispose) o.material.map.dispose();
        o.material.dispose();
      }
    }
  });
  while (g.children.length) g.remove(g.children[0]);
}

/* Which face carries the door. The room is dry, so the only thing that
   matters is that it opens back toward the entry. */
function doorFace(r){
  var cx = r.x + r.w/2, cz = r.z + r.d/2;
  var dx = (ENTRY.x + ENTRY.w/2) - cx;
  var dz = (ENTRY.z + ENTRY.d/2) - cz;
  if (Math.abs(dx) > Math.abs(dz)) return dx < 0 ? 'w' : 'e';
  return dz < 0 ? 'n' : 's';
}

function tableGrid(r){
  var cols = Math.max(1, Math.floor((r.w - 1.5) / 8.5));
  var rws  = Math.max(1, Math.floor((r.d - 1.5) / 8.5));
  return { cols:cols, rows:rws, seats:cols * rws * 6 };
}

function buildRooms(){
  disposeGroup(roomGroup);
  var wm = mat(C.wallIn, { side: THREE.DoubleSide });

  rooms.forEach(function (r, idx){
    var g = new THREE.Group();
    g.add(floorPad(0, 0, r.w, r.d, finish('wood')));

    var face = doorFace(r);
    [['n', 0, 0, r.w, 0], ['s', 0, r.d, r.w, r.d],
     ['w', 0, 0, 0, r.d], ['e', r.w, 0, r.w, r.d]].forEach(function (q){
      g.add(wallRun(q[1], q[2], q[3], q[4], ROOMH, wm, q[0] === face ? 0.5 : null, 3.5));
    });

    var tg = tableGrid(r);
    for (var cx = 0; cx < tg.cols; cx++){
      for (var cz = 0; cz < tg.rows; cz++){
        var t = new THREE.Group();
        var tt = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.25, 20), mat(0xe4e7df));
        tt.position.y = 2.5;
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 2.5, 10), mat(0x4a524d));
        leg.position.y = 1.25;
        t.add(tt, leg);
        for (var c = 0; c < 6; c++){
          var a = c / 6 * Math.PI * 2;
          var ch = box(1.3, 1.5, 1.3, mat(c % 2 ? 0xffb03a : 0xff8a3a));
          ch.position.set(Math.cos(a) * 3.5, 0.9, Math.sin(a) * 3.5);
          t.add(ch);
        }
        t.position.set(r.w * (cx + 0.5) / tg.cols, 0, r.d * (cz + 0.5) / tg.rows);
        g.add(t);
      }
    }

    /* colour band over the door so the room reads from the air */
    var cm = mat(ROOMCOL[idx % ROOMCOL.length]);
    var band = (face === 'e' || face === 'w')
      ? box(0.24, 0.7, r.d * 0.86, cm)
      : box(r.w * 0.86, 0.7, 0.24, cm);
    band.position.set(
      face === 'e' ? r.w : face === 'w' ? 0 : r.w/2,
      ROOMH - 1.1,
      face === 's' ? r.d : face === 'n' ? 0 : r.d/2
    );
    g.add(band);

    g.position.set(r.x, 0, r.z);
    roomGroup.add(g);
  });
}

function buildFields(){
  disposeGroup(fieldGroup);

  fields.forEach(function (f){
    var g = new THREE.Group();

    var tm = new THREE.MeshLambertMaterial({ map: turfTexture(f.w, f.d) });
    var turf = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.d), tm);
    turf.rotation.x = -Math.PI/2;
    turf.position.set(f.w/2, 0.05, f.d/2);
    g.add(turf);

    var em = mat(0x1f5a38);
    var e1 = box(f.w, 0.16, 0.3, em); e1.position.set(f.w/2, 0.08, 0);
    var e2 = box(f.w, 0.16, 0.3, em); e2.position.set(f.w/2, 0.08, f.d);
    var e3 = box(0.3, 0.16, f.d, em); e3.position.set(0, 0.08, f.d/2);
    var e4 = box(0.3, 0.16, f.d, em); e4.position.set(f.w, 0.08, f.d/2);
    g.add(e1, e2, e3, e4);

    var gw = Math.min(Math.max(f.w * 0.22, 8), 24);
    var gh = Math.min(Math.max(gw * 0.36, 4), 8);
    var gd = gh * 0.55;
    var gN = goal(gw, gh, gd);
    gN.position.set(f.w/2, 0, 2.5);
    gN.rotation.y = Math.PI;
    var gS = goal(gw, gh, gd);
    gS.position.set(f.w/2, 0, f.d - 2.5);
    g.add(gN, gS);

    var nh = 14;
    var nt = netTexture();
    function panel(w, x, z, rot){
      var t2 = nt.clone(); t2.needsUpdate = true; t2.repeat.set(w/3, nh/3);
      var m2 = new THREE.MeshLambertMaterial({
        map: t2, transparent:true, opacity:0.34, side:THREE.DoubleSide,
        color:0xdfe6da, depthWrite:false
      });
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, nh), m2);
      p.position.set(x, nh/2, z);
      p.rotation.y = rot;
      g.add(p);
    }
    panel(f.w, f.w/2, 0, 0);
    panel(f.w, f.w/2, f.d, 0);
    panel(f.d, 0, f.d/2, Math.PI/2);
    panel(f.d, f.w, f.d/2, Math.PI/2);

    var pm = mat(0x3c443f);
    var stepX = f.w / Math.max(2, Math.round(f.w / 14));
    var stepZ = f.d / Math.max(2, Math.round(f.d / 14));
    for (var x = 0; x <= f.w + 0.01; x += stepX){
      [0, f.d].forEach(function (zz){
        var p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, nh, 6), pm);
        p.position.set(x, nh/2, zz); g.add(p);
      });
    }
    for (var z = stepZ; z < f.d - 0.01; z += stepZ){
      [0, f.w].forEach(function (xx){
        var p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, nh, 6), pm);
        p.position.set(xx, nh/2, z); g.add(p);
      });
    }

    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), mat(0xf4f7f0));
    ball.position.set(f.w/2, 0.4, f.d/2);
    g.add(ball);

    g.position.set(f.x, 0, f.z);
    fieldGroup.add(g);
  });
}

/* --------------------------------------------------------------- lights */

function setupLights(){
  var amb = new THREE.AmbientLight(0xffffff, 0.62);
  scene.add(amb); dayLights.push(amb);

  var sun = new THREE.DirectionalLight(0xffffff, 0.72);
  sun.position.set(-90, 160, -60);
  scene.add(sun); dayLights.push(sun);

  var fill = new THREE.DirectionalLight(0xcfe0ff, 0.3);
  fill.position.set(120, 90, 150);
  scene.add(fill); dayLights.push(fill);

  var damb = new THREE.AmbientLight(0x2a3a4a, 0.5);
  damb.visible = false; scene.add(damb); duskLights.push(damb);

  for (var z = 30; z < SHELL.d; z += 40){
    var pl = new THREE.PointLight(0xfff0d0, 0.85, 90);
    pl.position.set(SHELL.w/2, SHELL.clear - 4, z);
    pl.visible = false;
    scene.add(pl); duskLights.push(pl);
  }
}

/* --------------------------------------------------------------- camera */

function applyOrbit(){
  orb.gx += (orb.tx - orb.gx) * 0.12;
  orb.gy += (orb.ty - orb.gy) * 0.12;
  orb.gz += (orb.tz - orb.gz) * 0.12;
  orb.gdist += (orb.dist - orb.gdist) * 0.12;
  orb.gyaw += (orb.yaw - orb.gyaw) * 0.14;
  orb.gpit += (orb.pit - orb.gpit) * 0.14;

  var cp = Math.cos(orb.gpit), sp = Math.sin(orb.gpit);
  camera.position.set(
    orb.gx + orb.gdist * cp * Math.cos(orb.gyaw),
    orb.gy + orb.gdist * sp,
    orb.gz + orb.gdist * cp * Math.sin(orb.gyaw)
  );
  camera.lookAt(orb.gx, orb.gy + 4, orb.gz);
}

function applyWalk(dt){
  var sp = 13 * dt;
  var fwd = 0, str = 0;
  if (walk.keys.w) fwd += 1;
  if (walk.keys.s) fwd -= 1;
  if (walk.keys.d) str += 1;
  if (walk.keys.a) str -= 1;
  if (walk.stick.active){ fwd += -walk.stick.dy; str += walk.stick.dx; }
  if (walk.keys.shift) sp *= 1.9;

  var sy = Math.sin(walk.yaw), cy = Math.cos(walk.yaw);
  walk.vx += ((sy * fwd + cy * str) * sp - walk.vx) * 0.3;
  walk.vz += ((cy * fwd - sy * str) * sp - walk.vz) * 0.3;

  var pad = 1.6;
  walk.x = Math.max(pad, Math.min(SHELL.w - pad, walk.x + walk.vx));
  walk.z = Math.max(pad, Math.min(SHELL.d - pad, walk.z + walk.vz));

  camera.position.set(walk.x, walk.eye, walk.z);
  camera.lookAt(new THREE.Vector3(
    walk.x + Math.sin(walk.yaw) * 10,
    walk.eye + Math.tan(walk.pit) * 10,
    walk.z + Math.cos(walk.yaw) * 10
  ));
}

/* ---------------------------------------------------------------- input */

function bindInput(){
  var drag = null;

  function pt(e){ var t = e.touches ? e.touches[0] : e; return { x:t.clientX, y:t.clientY }; }

  function down(e){ drag = pt(e); drag.two = !!(e.touches && e.touches.length > 1); }
  function move(e){
    if (!drag) return;
    var p = pt(e);
    var dx = p.x - drag.x, dy = p.y - drag.y, two = drag.two;
    drag = p; drag.two = two;
    if (walk.on){
      walk.yaw -= dx * 0.005;
      walk.pit = Math.max(-0.85, Math.min(0.85, walk.pit - dy * 0.004));
    } else if (two || e.shiftKey){
      var s = orb.gdist * 0.0016;
      orb.tx -= (Math.cos(orb.yaw + Math.PI/2) * dx - Math.sin(orb.yaw + Math.PI/2) * dy) * s;
      orb.tz -= (Math.sin(orb.yaw + Math.PI/2) * dx + Math.cos(orb.yaw + Math.PI/2) * dy) * s;
    } else {
      orb.yaw += dx * 0.006;
      orb.pit = Math.max(0.06, Math.min(1.45, orb.pit + dy * 0.005));
    }
    if (e.cancelable) e.preventDefault();
  }
  function up(){ drag = null; }

  stage.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  stage.addEventListener('touchstart', down, { passive: true });
  stage.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', up);

  stage.addEventListener('wheel', function (e){
    if (walk.on) return;
    orb.dist = Math.max(26, Math.min(420, orb.dist + e.deltaY * 0.35));
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', function (e){
    var k = e.key.toLowerCase();
    if (k === 'escape' && walk.on){ setMode('orbit'); return; }
    if (!walk.on) return;
    if (k === 'w' || k === 'arrowup') walk.keys.w = 1;
    if (k === 's' || k === 'arrowdown') walk.keys.s = 1;
    if (k === 'a' || k === 'arrowleft') walk.keys.a = 1;
    if (k === 'd' || k === 'arrowright') walk.keys.d = 1;
    if (k === 'shift') walk.keys.shift = 1;
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e){
    var k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') walk.keys.w = 0;
    if (k === 's' || k === 'arrowdown') walk.keys.s = 0;
    if (k === 'a' || k === 'arrowleft') walk.keys.a = 0;
    if (k === 'd' || k === 'arrowright') walk.keys.d = 0;
    if (k === 'shift') walk.keys.shift = 0;
  });
}

/* ----------------------------------------------------------------- tags */

function ft(v){
  var w = Math.floor(v);
  var i = Math.round((v - w) * 12);
  if (i === 12){ w++; i = 0; }
  return w + "'" + (i ? '-' + i + '"' : '');
}

function rebuildTags(){
  TAGS = [];
  LOCKED.forEach(function (r){
    TAGS.push({ label:r.name, sub:Math.round(r.w * r.d).toLocaleString() + ' SF',
                p:new THREE.Vector3(r.x + r.w/2, 8, r.z + r.d/2) });
  });
  rooms.forEach(function (r){
    TAGS.push({ label:r.name, sub:ft(r.w) + ' x ' + ft(r.d) + ' \u00b7 ' + tableGrid(r).seats + ' seats',
                p:new THREE.Vector3(r.x + r.w/2, 11, r.z + r.d/2), hot:true });
  });
  fields.forEach(function (f){
    TAGS.push({ label:f.name, sub:ft(f.w) + ' x ' + ft(f.d),
                p:new THREE.Vector3(f.x + f.w/2, 15, f.z + f.d/2), hot:true });
  });
  if (tagHost){
    tagHost.innerHTML = '';
    tagItems = TAGS.map(function (t){
      var el = document.createElement('div');
      el.className = 'tag' + (t.hot ? ' tag-hot' : '');
      el.innerHTML = '<b>' + t.label + '</b><span>' + t.sub + '</span>';
      tagHost.appendChild(el);
      return el;
    });
  }
}

var _v = new THREE.Vector3();
function updateTags(){
  if (!tagItems.length) return;
  if (walk.on){ tagItems.forEach(function (el){ el.style.display = 'none'; }); return; }
  var rect = stage.getBoundingClientRect();
  var boxes = [];
  TAGS.forEach(function (t, i){
    var el = tagItems[i];
    if (!el) return;
    _v.copy(t.p).project(camera);
    if (_v.z > 1){ el.style.display = 'none'; return; }
    var x = (_v.x * 0.5 + 0.5) * rect.width;
    var y = (-_v.y * 0.5 + 0.5) * rect.height;
    if (x < 40 || x > rect.width - 40 || y < 20 || y > rect.height - 20){
      el.style.display = 'none'; return;
    }
    var b = { x1:x - 66, y1:y - 16, x2:x + 66, y2:y + 16 };
    var hit = boxes.some(function (o){
      return !(b.x2 < o.x1 || b.x1 > o.x2 || b.y2 < o.y1 || b.y1 > o.y2);
    });
    if (hit && !t.hot){ el.style.display = 'none'; return; }
    boxes.push(b);
    el.style.display = 'block';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  });
}

/* ----------------------------------------------------------------- loop */

var last = 0;
function animate(t){
  if (!running) return;
  requestAnimationFrame(animate);
  var dt = Math.min(0.05, (t - last) / 1000 || 0.016);
  last = t;
  if (walk.on) applyWalk(dt); else applyOrbit();
  renderer.render(scene, camera);
  updateTags();
}

/* -------------------------------------------------------------- exports */

function setMode(m){
  if (m === 'walk'){
    walk.on = true;
    setWalls(false);
    walk.x = 11; walk.z = 10; walk.yaw = 0.35; walk.pit = 0;
  } else {
    walk.on = false;
    walk.keys = {};
  }
  if (onModeChange) onModeChange(m);
}

function setView(name){
  if (walk.on) setMode('orbit');
  var v;
  if (name === 'party' && rooms.length){
    var x = 0, z = 0;
    rooms.forEach(function (r){ x += (r.x + r.w/2) / rooms.length; z += (r.z + r.d/2) / rooms.length; });
    v = { tx:x, tz:z, dist:88, yaw:-Math.PI/2 - 0.6, pit:0.55, ty:2 };
  } else {
    v = {
      aerial:  { tx:SHELL.w/2, tz:SHELL.d/2, dist:238, yaw:-Math.PI/2, pit:1.05, ty:0 },
      entry:   { tx:SHELL.w/2, tz:24,        dist:96,  yaw:-Math.PI/2, pit:0.42, ty:2 },
      pitches: { tx:SHELL.w/2, tz:112,       dist:176, yaw:-Math.PI/2, pit:0.5,  ty:2 },
      section: { tx:SHELL.w/2, tz:SHELL.d/2, dist:212, yaw:-Math.PI,   pit:0.16, ty:6 }
    }[name];
  }
  if (!v) return;
  Object.keys(v).forEach(function (k){ orb[k] = v[k]; });
}

function focusRect(r, pad){
  if (walk.on) setMode('orbit');
  orb.tx = r.x + r.w/2; orb.tz = r.z + r.d/2; orb.ty = 2;
  orb.dist = Math.max(r.w, r.d) * (pad || 1.7);
  orb.pit = 0.55;
}
function focusField(i){ if (fields[i]) focusRect(fields[i]); }
function focusRoom(i){ if (rooms[i]) focusRect(rooms[i], 2.8); }

function setWalls(full){
  var s = full ? 1 : CUT / SHELL.clear;
  extWalls.forEach(function (m){
    if (m.name === 'deck') m.visible = full;
    else m.scale.y = s;
  });
}

function setPeople(on){ peopleGroup.visible = on; }

function setDusk(on){
  dayLights.forEach(function (l){ l.visible = !on; });
  duskLights.forEach(function (l){ l.visible = on; });
  scene.background = new THREE.Color(on ? 0x0a1f16 : 0xe7ece4);
  scene.fog = new THREE.Fog(on ? 0x0a1f16 : 0xe7ece4, 260, 620);
}

function setFields(next){ fields = clone(next); buildFields(); rebuildTags(); }
function setRooms(next){ rooms = clone(next); buildRooms(); rebuildTags(); }

function walkTo(x, z, yaw){
  walk.x = x; walk.z = z;
  if (yaw !== undefined) walk.yaw = yaw;
  if (!walk.on) setMode('walk');
}

function resize(){
  if (!renderer) return;
  camera.aspect = stage.clientWidth / stage.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(stage.clientWidth, stage.clientHeight);
}

function init(opts){
  opts = opts || {};
  stage = document.getElementById(opts.stage || 'stage');
  tagHost = opts.tags ? document.getElementById(opts.tags) : null;
  onModeChange = opts.onModeChange || null;
  if (opts.fields) fields = clone(opts.fields);
  if (opts.rooms) rooms = clone(opts.rooms);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe7ece4);
  scene.fog = new THREE.Fog(0xe7ece4, 260, 620);

  camera = new THREE.PerspectiveCamera(52, stage.clientWidth / stage.clientHeight, 0.4, 2200);
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  stage.appendChild(renderer.domElement);

  staticGroup = new THREE.Group();
  fieldGroup = new THREE.Group();
  roomGroup = new THREE.Group();
  peopleGroup = buildPeople();
  scene.add(staticGroup, fieldGroup, roomGroup, peopleGroup);

  staticGroup.add(buildShell(), buildLocked(), buildLights());

  setupLights();
  buildFields();
  buildRooms();
  rebuildTags();
  setWalls(false);

  window.addEventListener('resize', resize);
  bindInput();

  running = true;
  requestAnimationFrame(animate);
  return api;
}

var api = {
  init: init,
  SHELL: SHELL,
  LOCKED: LOCKED,
  DEFAULT_ROOMS: DEFAULT_ROOMS,
  DEFAULT_FIELDS: DEFAULT_FIELDS,
  setFields: setFields,
  setRooms: setRooms,
  setView: setView,
  setWalls: setWalls,
  setPeople: setPeople,
  setDusk: setDusk,
  setMode: setMode,
  focusField: focusField,
  focusRoom: focusRoom,
  walkTo: walkTo,
  resize: resize,
  ft: ft,
  seats: function (r){ return tableGrid(r).seats; },
  doorFace: doorFace,
  stick: walk.stick
};

return api;
})();
