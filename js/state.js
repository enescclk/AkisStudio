(() => {
  "use strict";

  const A = window.AkisStudio = window.AkisStudio || {};
  const root = document.getElementById("akis-studio");
  if (!root) throw new Error("#akis-studio bulunamadı");

  A.root = root;
  A.$ = (selector) => root.querySelector(selector);
  A.$$ = (selector) => [...root.querySelectorAll(selector)];
  A.ns = "http://www.w3.org/2000/svg";

  A.keys = {
    project:"akis-studio-project-v1",
    theme:"akis-studio-theme-v1",
    shapes:"akis-studio-saved-shapes-v1",
    paletteWidth:"akis-studio-palette-width-v1",
    paletteCollapsed:"akis-studio-palette-collapsed-v1"
  };

  A.defaults = {
    node:{
      fill:"#ffffff",
      stroke:"#475569",
      strokeWidth:1.5,
      textColor:"#172033",
      fontSize:14,
      fontFamily:"Inter, Segoe UI, sans-serif",
      bold:false,
      italic:false,
      underline:false,
      textAlign:"center",
      verticalAlign:"middle",
      cornerRadius:1
    },
    edge:{
      color:"#475569",
      width:2,
      lineStyle:"solid",
      routing:"orthogonal",
      cornerRadius:6,
      endpointSize:1,
      startArrow:"none",
      endArrow:"arrow"
    }
  };

  const rawNodes = [
    ["n1","rect",80,300,120,58,"Bireysel\nAraştırma"],
    ["n2","rect",250,280,130,76,"Fikir Paylaşımı\nEkleme\nÇıkarma"],
    ["n3","rect",430,300,130,58,"Raporlamaya\nBaşlama"],
    ["n4","rect",430,430,130,76,"Fikir Paylaşımı\nEkleme\nÇıkarma"],
    ["n5","rect",250,445,130,58,"Raporlama"],
    ["n6","rect",80,445,120,58,"Hamed\nKhazagachi",{
      fill:"#ef4444",
      stroke:"#b91c1c",
      textColor:"#ffffff",
      bold:true
    }],
    ["n7","rect",750,170,125,58,"İletişim"],
    ["n8","rect",590,270,105,58,"S2T"],
    ["n9","rect",760,270,105,58,"T2S"],
    ["n10","rect",930,270,105,58,"Ekran"],
    ["n11","rect",490,380,115,58,"Filtre"],
    ["n12","rect",490,465,115,58,"Dil Algılama"],
    ["n13","rect",750,380,125,68,"Engelli\ndesteği"],
    ["n14","rounded",1040,85,90,40,"İdris"],
    ["n15","rect",1280,170,125,58,"Hareket"],
    ["n16","rect",1160,270,120,58,"Mekanik"],
    ["n17","rect",1430,270,120,58,"Yazılım"],
    ["n18","rect",1030,380,120,58,"Kafa/Ekran"],
    ["n19","rect",1170,380,110,58,"Teker"],
    ["n20","rect",1015,470,110,58,"Servo"],
    ["n21","rect",1015,555,110,58,"LCD Ekran"],
    ["n22","rect",1165,470,110,58,"Servo"],
    ["n23","rect",1320,380,110,58,"Mapping"],
    ["n24","rect",1465,380,130,58,"Manuel\nKontrol"],
    ["n25","rect",1640,380,125,58,"Otonom\ngidiş"],
    ["n26","rect",1320,470,110,58,"Sensör"],
    ["n27","rect",1340,555,100,50,"Lidar"],
    ["n28","rect",1340,630,100,50,"Ultra Sonic"],
    ["n29","rect",1340,705,100,50,"Kamera"],
    ["n30","rect",1340,780,100,50,"Kızılötesi"],
    ["n31","rect",1495,485,110,50,"Kumanda"],
    ["n32","rect",1495,560,110,50,"Alıcı"],
    ["n33","rect",1635,485,120,58,"Rota\nOluşturma"],
    ["n34","rect",1780,485,120,58,"Engel\nalgılama"],
    ["n35","rect",1925,485,130,58,"Engele\nçarpmama"],
    ["n36","rect",1775,585,130,58,"YOLO V8 /\nOpenCV"],
    ["n37","rect",1930,585,120,58,"AI/Unreal"],
    ["n38","rect",970,900,120,58,"Enerji"],
    ["n39","rect",920,995,120,54,"Yerini bulmak"],
    ["n40","rect",1070,995,120,54,"Gezi çapı"],
    ["n41","rect",910,1085,135,58,"Gerekli Enerji"],
    ["n42","rect",1060,1085,140,58,"Şarj olma\nsistemi"]
  ];

  const rawEdges = [
    ["n1","n2"],
    ["n2","n3"],
    ["n3","n4"],
    ["n4","n5"],
    ["n5","n6"],
    ["n7","n8"],
    ["n7","n9"],
    ["n7","n10"],
    ["n11","n8"],
    ["n12","n8"],
    ["n9","n13"],
    ["n15","n16"],
    ["n15","n17"],
    ["n16","n18"],
    ["n16","n19"],
    ["n18","n20"],
    ["n18","n21"],
    ["n19","n22"],
    ["n17","n23"],
    ["n17","n24"],
    ["n17","n25"],
    ["n23","n26"],
    ["n26","n27"],
    ["n26","n28"],
    ["n26","n29"],
    ["n26","n30"],
    ["n24","n31"],
    ["n24","n32"],
    ["n25","n33"],
    ["n25","n34"],
    ["n25","n35"],
    ["n34","n36"],
    ["n35","n37"],
    ["n38","n39"],
    ["n38","n40"],
    ["n39","n41"],
    ["n40","n42"]
  ];

  const createInitialNodes = () => rawNodes.map((item) => ({
    ...A.defaults.node,
    id:item[0],
    type:item[1],
    x:item[2],
    y:item[3],
    w:item[4],
    h:item[5],
    text:item[6],
    ...(item[7] || {})
  }));

  const createInitialEdges = () => rawEdges.map((item,index) => ({
    ...A.defaults.edge,
    id:`e${index + 1}`,
    from:item[0],
    to:item[1]
  }));

  A.state = {
    name:"Robot Projesi",
    nodes:createInitialNodes(),
    edges:createInitialEdges(),
    selectedNode:null,
    selectedNodes:[],
    selectedEdge:null,
    connectMode:false,
    connectSource:null,
    grid:true,
    snap:true,
    zoom:0.72,
    panX:80,
    panY:30,
    undo:[],
    redo:[]
  };

  A.runtime = {
    drag:null,
    clipboard:null,
    spaceDown:false,
    uidCounter:0,
    saveTimer:null,
    currentFilePath:null,
    dirty:false,
    savedShapes:[],
    lastNodePress:{id:null,at:0},
    paletteResize:null,
    lineWidthGesture:false
  };

  A.el = (name,attrs={}) => {
    const node = document.createElementNS(A.ns,name);

    Object.entries(attrs).forEach(([key,value]) => {
      node.setAttribute(key,String(value));
    });

    return node;
  };

  A.uid = (prefix) => {
    A.runtime.uidCounter += 1;

    return (
      prefix +
      Date.now().toString(36) +
      A.runtime.uidCounter.toString(36)
    );
  };

  A.getNode = (id) => {
    return A.state.nodes.find((node) => node.id === id);
  };

  A.getEdge = (id) => {
    return A.state.edges.find((edge) => edge.id === id);
  };

  A.snapValue = (value) => {
    return A.state.snap
      ? Math.round(value / 10) * 10
      : value;
  };

  A.nodeCenter = (node) => ({
    x:node.x + node.w / 2,
    y:node.y + node.h / 2
  });

  A.portPoint = (node,side) => {
    if (side === "left") {
      return {
        x:node.x,
        y:node.y + node.h / 2
      };
    }

    if (side === "right") {
      return {
        x:node.x + node.w,
        y:node.y + node.h / 2
      };
    }

    if (side === "top") {
      return {
        x:node.x + node.w / 2,
        y:node.y
      };
    }

    return {
      x:node.x + node.w / 2,
      y:node.y + node.h
    };
  };

  A.bestSides = (first,second) => {
    const a = A.nodeCenter(first);
    const b = A.nodeCenter(second);
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    if (Math.abs(dx) > Math.abs(dy) * 1.12) {
      return dx >= 0
        ? ["right","left"]
        : ["left","right"];
    }

    return dy >= 0
      ? ["bottom","top"]
      : ["top","bottom"];
  };

  A.selectedNodeIds = () => {
    const ids = (A.state.selectedNodes || [])
      .filter((id) => A.getNode(id));

    if (
      A.state.selectedNode &&
      !ids.includes(A.state.selectedNode) &&
      A.getNode(A.state.selectedNode)
    ) {
      ids.push(A.state.selectedNode);
    }

    return [...new Set(ids)];
  };

  A.selectedNodeObjects = () => {
    return A.selectedNodeIds()
      .map(A.getNode)
      .filter(Boolean);
  };

  A.setNodeSelection = (ids) => {
    A.state.selectedNodes = [...new Set(ids)]
      .filter((id) => A.getNode(id));

    A.state.selectedNode =
      A.state.selectedNodes.length === 1
        ? A.state.selectedNodes[0]
        : null;

    A.state.selectedEdge = null;
  };

  A.selectionBounds = (nodes) => {
    if (!nodes.length) return null;

    const minX = Math.min(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxX = Math.max(...nodes.map((node) => node.x + node.w));
    const maxY = Math.max(...nodes.map((node) => node.y + node.h));

    return {
      x:minX,
      y:minY,
      w:maxX - minX,
      h:maxY - minY
    };
  };

  A.serializable = () => ({
    version:3,
    name:A.state.name,
    nodes:A.state.nodes,
    edges:A.state.edges,
    grid:A.state.grid,
    snap:A.state.snap
  });

  A.snapshot = () => {
    return JSON.stringify(A.serializable());
  };

  A.pushHistory = () => {
    const current = A.snapshot();

    if (A.state.undo[A.state.undo.length - 1] !== current) {
      A.state.undo.push(current);
    }

    if (A.state.undo.length > 80) {
      A.state.undo.shift();
    }

    A.state.redo = [];
  };

  A.applySnapshot = (input,{markDirty=true}={}) => {
    const data =
      typeof input === "string"
        ? JSON.parse(input)
        : input;

    A.state.name = data.name || "İsimsiz Diyagram";

    A.state.nodes = Array.isArray(data.nodes)
      ? data.nodes.map((node) => ({
          ...A.defaults.node,
          ...node
        }))
      : [];

    A.state.edges = Array.isArray(data.edges)
      ? data.edges.map((edge) => ({
          ...A.defaults.edge,
          ...edge
        }))
      : [];

    A.state.grid = data.grid !== false;
    A.state.snap = data.snap !== false;
    A.state.selectedNode = null;
    A.state.selectedNodes = [];
    A.state.selectedEdge = null;
    A.state.connectSource = null;

    A.$("#ae-doc-name").value = A.state.name;
    A.$("#ae-snap").checked = A.state.snap;

    A.render?.();

    if (markDirty) {
      A.scheduleSave();
    }
  };

  A.undo = () => {
    if (!A.state.undo.length) return;

    A.state.redo.push(A.snapshot());
    A.applySnapshot(A.state.undo.pop());
  };

  A.redo = () => {
    if (!A.state.redo.length) return;

    A.state.undo.push(A.snapshot());
    A.applySnapshot(A.state.redo.pop());
  };

  A.updateWindowTitle = () => {
    window.desktopAPI?.setWindowTitle({
      name:A.state.name,
      filePath:A.runtime.currentFilePath,
      dirty:A.runtime.dirty
    });
  };

  A.scheduleSave = (markDirty=true) => {
    if (markDirty) {
      A.runtime.dirty = true;
    }

    const label = A.$("#ae-save-state");

    if (label) {
      label.textContent = A.runtime.dirty
        ? "Kaydedilmedi"
        : "Kaydedildi";
    }

    A.updateWindowTitle();
    clearTimeout(A.runtime.saveTimer);

    A.runtime.saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(
          A.keys.project,
          A.snapshot()
        );

        if (label) {
          label.textContent = A.runtime.dirty
            ? "Yerel yedek alındı • Kaydedilmedi"
            : "Dosyaya kaydedildi";
        }
      } catch {
        if (label) {
          label.textContent = "Yerel kayıt kullanılamadı";
        }
      }
    },220);
  };

  A.setStatus = (message) => {
    const status = A.$("#ae-status");
    if (!status) return;

    status.textContent = message;
    clearTimeout(A.setStatus.timer);

    A.setStatus.timer = setTimeout(() => {
      status.textContent =
        `${A.state.nodes.length} kutu · ` +
        `${A.state.edges.length} bağlantı`;
    },1800);
  };

  A.resetState = () => {
    A.state.name = "Robot Projesi";
    A.state.nodes = createInitialNodes();
    A.state.edges = createInitialEdges();
    A.state.selectedNode = null;
    A.state.selectedNodes = [];
    A.state.selectedEdge = null;
  };
})();