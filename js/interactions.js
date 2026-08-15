(() => {
  "use strict";

  const A=window.AkisStudio;

  A.handleConnectClick=(id)=>{
    if(!A.state.connectSource){
      A.state.connectSource=id;
      A.setNodeSelection([id]);
      A.setStatus("Şimdi hedef kutuyu seç");
      A.render();
      return;
    }

    if(A.state.connectSource!==id){
      const from=A.getNode(
        A.state.connectSource
      );

      const to=A.getNode(id);

      if(!from||!to){
        A.state.connectSource=null;
        A.state.connectMode=false;
        A.render();
        return;
      }

      const [fromSide,toSide]=
        A.bestSides(from,to);

      A.pushHistory();

      A.state.edges.push({
        id:A.uid("e"),
        from:from.id,
        to:to.id,
        fromSide,
        toSide,
        ...A.edgeStyleForNodes(from,to)
      });

      A.scheduleSave();
      A.setStatus("Bağlantı oluşturuldu");
    }

    A.state.connectSource=null;
    A.state.connectMode=false;
    A.setNodeSelection([id]);
    A.render();
  };

  A.nodePointerDown=(event)=>{
    if(event.button!==0){
      return;
    }

    event.stopPropagation();

    const id=
      event.currentTarget.dataset.nodeId;

    const node=A.getNode(id);

    if(!node){
      return;
    }

    if(event.ctrlKey||event.metaKey){
      event.preventDefault();

      A.runtime.lastNodePress={
        id:null,
        at:0
      };

      if(!A.state.connectMode){
        A.state.connectMode=true;
        A.state.connectSource=null;
      }

      A.handleConnectClick(id);
      return;
    }

    if(event.shiftKey){
      event.preventDefault();

      A.runtime.lastNodePress={
        id:null,
        at:0
      };

      const ids=A.selectedNodeIds();

      A.setNodeSelection(
        ids.includes(id)
          ? ids.filter(
              (item)=>item!==id
            )
          : [...ids,id]
      );

      A.render();

      A.setStatus(
        `${A.selectedNodeIds().length} `+
        `kutu seçildi`
      );

      return;
    }

    const now=performance.now();

    const doublePress=
      A.runtime.lastNodePress.id===id &&
      now-A.runtime.lastNodePress.at<=430;

    A.runtime.lastNodePress=
      doublePress
        ? {id:null,at:0}
        : {id,at:now};

    if(doublePress){
      event.preventDefault();

      A.runtime.drag=null;
      A.setNodeSelection([id]);
      A.render();
      A.editNode(node);

      return;
    }

    if(A.state.connectMode){
      A.handleConnectClick(id);
      return;
    }

    if(!A.selectedNodeIds().includes(id)){
      A.setNodeSelection([id]);
    }

    A.pushHistory();

    const start=A.worldPoint(event);
    const ids=A.selectedNodeIds();

    A.runtime.drag=
      ids.length>1
        ? {
            type:"nodes",
            ids,
            start,
            moved:false,
            origins:ids.map((nodeId)=>{
              const item=A.getNode(nodeId);

              return {
                id:nodeId,
                x:item.x,
                y:item.y
              };
            })
          }
        : {
            type:"node",
            id,
            start,
            originX:node.x,
            originY:node.y,
            moved:false
          };

    A.svg.setPointerCapture(
      event.pointerId
    );

    A.render();
  };

  A.startPortConnect=(
    event,
    node,
    side
  )=>{
    event.stopPropagation();
    A.pushHistory();

    const start=A.portPoint(node,side);

    A.runtime.drag={
      type:"connect",
      from:node.id,
      side,
      start,
      current:start
    };

    A.svg.setPointerCapture(
      event.pointerId
    );
  };

  A.startResize=(event,node)=>{
    event.stopPropagation();
    A.pushHistory();

    A.runtime.drag={
      type:"resize",
      id:node.id,
      start:A.worldPoint(event),
      w:node.w,
      h:node.h
    };

    A.svg.setPointerCapture(
      event.pointerId
    );
  };

  A.startEdgeEndpointDrag=(
    event,
    edge,
    endpoint
  )=>{
    event.stopPropagation();
    event.preventDefault();

    A.pushHistory();

    A.runtime.drag={
      type:"edge-endpoint",
      edgeId:edge.id,
      endpoint,
      original:{
        from:edge.from,
        to:edge.to,
        fromSide:edge.fromSide,
        toSide:edge.toSide,
        color:edge.color,
        endArrow:edge.endArrow
      }
    };

    A.svg.setPointerCapture(
      event.pointerId
    );
  };

  const pointerMove=(event)=>{
    const drag=A.runtime.drag;

    if(!drag){
      return;
    }

    if(drag.type==="pan"){
      A.state.panX=
        drag.panX+
        event.clientX-
        drag.clientX;

      A.state.panY=
        drag.panY+
        event.clientY-
        drag.clientY;

      A.updateTransform();
      return;
    }

    const point=A.worldPoint(event);

    if(drag.type==="node"){
      const node=A.getNode(drag.id);

      node.x=A.snapValue(
        drag.originX+
        point.x-
        drag.start.x
      );

      node.y=A.snapValue(
        drag.originY+
        point.y-
        drag.start.y
      );

      drag.moved=true;

      A.runtime.lastNodePress={
        id:null,
        at:0
      };

      A.renderEdges();
      A.renderNodes();
      A.renderOverlay();
    }else if(drag.type==="nodes"){
      const dx=point.x-drag.start.x;
      const dy=point.y-drag.start.y;

      drag.origins.forEach((origin)=>{
        const node=A.getNode(origin.id);

        if(node){
          node.x=A.snapValue(
            origin.x+dx
          );

          node.y=A.snapValue(
            origin.y+dy
          );
        }
      });

      drag.moved=true;

      A.runtime.lastNodePress={
        id:null,
        at:0
      };

      A.renderEdges();
      A.renderNodes();
      A.renderOverlay();
    }else if(drag.type==="marquee"){
      drag.current=point;

      const hits=A.nodesInRect(
        A.normalizedRect(
          drag.start,
          drag.current
        )
      );

      A.setNodeSelection(
        drag.additive
          ? [...drag.base,...hits]
          : hits
      );

      A.renderOverlay();
      A.updateToolbar?.();
    }else if(drag.type==="resize"){
      const node=A.getNode(drag.id);

      node.w=Math.max(
        70,
        A.snapValue(
          drag.w+
          point.x-
          drag.start.x
        )
      );

      node.h=Math.max(
        40,
        A.snapValue(
          drag.h+
          point.y-
          drag.start.y
        )
      );

      A.renderEdges();
      A.renderNodes();
      A.renderOverlay();
    }else if(
      drag.type==="edge-endpoint"
    ){
      const edge=A.getEdge(
        drag.edgeId
      );

      if(!edge){
        return;
      }

      const excludedId=
        drag.endpoint==="start"
          ? edge.to
          : edge.from;

      const target=A.hitNode(
        point,
        excludedId
      );

      if(target){
        if(drag.endpoint==="start"){
          edge.from=target.id;

          edge.fromSide=A.nearestSide(
            target,
            point
          );
        }else{
          edge.to=target.id;

          edge.toSide=A.nearestSide(
            target,
            point
          );
        }

        A.renderEdges();
        A.renderOverlay();
      }else{
        A.renderOverlay();

        const from=A.getNode(edge.from);
        const to=A.getNode(edge.to);

        if(!from||!to){
          return;
        }

        const sides=
          edge.fromSide&&edge.toSide
            ? [
                edge.fromSide,
                edge.toSide
              ]
            : A.bestSides(from,to);

        const fixed=
          drag.endpoint==="start"
            ? A.portPoint(to,sides[1])
            : A.portPoint(from,sides[0]);

        const d=
          drag.endpoint==="start"
            ? (
                `M ${point.x} ${point.y} `+
                `L ${fixed.x} ${fixed.y}`
              )
            : (
                `M ${fixed.x} ${fixed.y} `+
                `L ${point.x} ${point.y}`
              );

        A.overlayLayer.append(
          A.el("path",{
            class:"ae-temp-edge",
            d
          })
        );
      }
    }else if(drag.type==="connect"){
      drag.current=point;

      A.renderOverlay();

      A.overlayLayer.append(
        A.el("path",{
          class:"ae-temp-edge",
          d:
            `M ${drag.start.x} `+
            `${drag.start.y} `+
            `L ${point.x} ${point.y}`
        })
      );
    }
  };

  const pointerUp=(event)=>{
    if(!A.runtime.drag){
      return;
    }

    const completed=A.runtime.drag;
    A.runtime.drag=null;

    if(
      A.svg.hasPointerCapture(
        event.pointerId
      )
    ){
      A.svg.releasePointerCapture(
        event.pointerId
      );
    }

    A.svg.classList.remove(
      "is-panning"
    );

    if(completed.type==="connect"){
      const point=A.worldPoint(event);

      const target=A.hitNode(
        point,
        completed.from
      );

      if(target){
        const source=A.getNode(
          completed.from
        );

        A.state.edges.push({
          id:A.uid("e"),
          from:completed.from,
          to:target.id,
          fromSide:completed.side,
          toSide:A.nearestSide(
            target,
            point
          ),
          ...A.edgeStyleForNodes(
            source,
            target
          )
        });

        A.setNodeSelection([target.id]);
        A.setStatus(
          "Bağlantı oluşturuldu"
        );
      }else{
        A.state.undo.pop();
      }
    }

    if(
      completed.type===
      "edge-endpoint"
    ){
      const point=A.worldPoint(event);

      const edge=A.getEdge(
        completed.edgeId
      );

      if(edge){
        const excludedId=
          completed.endpoint==="start"
            ? edge.to
            : edge.from;

        const target=A.hitNode(
          point,
          excludedId
        );

        if(target){
          if(
            completed.endpoint===
            "start"
          ){
            edge.from=target.id;

            edge.fromSide=
              A.nearestSide(
                target,
                point
              );
          }else{
            edge.to=target.id;

            edge.toSide=
              A.nearestSide(
                target,
                point
              );
          }

          const automatic=
            A.edgeStyleForNodes(
              A.getNode(edge.from),
              A.getNode(edge.to)
            );

          if([
            A.defaults.edge.color,
            "#ef4444",
            "#111111"
          ].includes(edge.color)){
            edge.color=automatic.color;
          }

          if(
            edge.endArrow==="none"||
            edge.endArrow===
              A.defaults.edge.endArrow
          ){
            edge.endArrow=
              automatic.endArrow;
          }

          A.state.selectedNode=null;
          A.state.selectedNodes=[];
          A.state.selectedEdge=edge.id;

          A.setStatus(
            "Bağlantı ucu taşındı"
          );
        }else{
          Object.assign(
            edge,
            completed.original
          );

          completed.cancelled=true;
          A.state.undo.pop();

          A.setStatus(
            "Bağlantı eski yerine döndü"
          );
        }
      }
    }

    if(
      [
        "node",
        "nodes"
      ].includes(completed.type)&&
      !completed.moved
    ){
      A.state.undo.pop();
    }

    if(completed.type==="marquee"){
      A.setStatus(
        `${A.selectedNodeIds().length} `+
        `kutu seçildi`
      );
    }

    if(
      ![
        "pan",
        "marquee"
      ].includes(completed.type)&&
      !completed.cancelled
    ){
      A.scheduleSave();
    }

    A.render();
  };

  A.addNode=(
    type,
    x,
    y,
    text="Yeni kutu",
    extra={}
  )=>{
    A.pushHistory();

    const tall=[
      "diamond",
      "triangle",
      "pentagon",
      "hexagon",
      "octagon",
      "star",
      "plus",
      "cloud"
    ];

    const arrows=[
      "arrow-right",
      "arrow-left",
      "arrow-up",
      "arrow-down",
      "lightning"
    ];

    const size=
      type==="text"
        ? [150,44]
        : A.circuitTypes.has(type)
          ? [120,72]
          : tall.includes(type)
            ? [110,90]
            : arrows.includes(type)
              ? [120,70]
              : [130,62];

    const node={
      id:A.uid("n"),
      type,
      x:A.snapValue(x),
      y:A.snapValue(y),
      w:size[0],
      h:size[1],
      text,
      ...A.defaults.node,
      ...extra
    };

    A.state.nodes.push(node);
    A.setNodeSelection([node.id]);
    A.render();
    A.scheduleSave();

    return node;
  };

  A.addAtCenter=(
    type,
    text,
    extra={}
  )=>{
    const rect=
      A.shell.getBoundingClientRect();

    const point={
      x:
        (
          rect.width/2-
          A.state.panX
        )/A.state.zoom,
      y:
        (
          rect.height/2-
          A.state.panY
        )/A.state.zoom
    };

    A.addNode(
      type,
      point.x-65,
      point.y-31,
      text,
      extra
    );
  };

  A.editNode=(node)=>{
    if(!node){
      return;
    }

    A.shell
      .querySelector(
        ".ae-inline-text-editor"
      )
      ?.blur();

    const shellRect=
      A.shell.getBoundingClientRect();

    const point=A.screenPoint({
      x:node.x,
      y:node.y
    });

    const width=Math.max(
      120,
      node.w*A.state.zoom
    );

    const height=Math.max(
      48,
      node.h*A.state.zoom
    );

    const editor=
      document.createElement("textarea");

    editor.className=
      "ae-inline-text-editor";

    editor.value=node.text||"";

    editor.setAttribute(
      "aria-label",
      "Kutu metni"
    );

    editor.title=
      "Enter: kaydet · "+
      "Shift+Enter: yeni satır · "+
      "Esc: iptal";

    Object.assign(editor.style,{
      left:
        `${Math.max(
          4,
          Math.min(
            point.x,
            shellRect.width-width-4
          )
        )}px`,
      top:
        `${Math.max(
          4,
          Math.min(
            point.y,
            shellRect.height-height-4
          )
        )}px`,
      width:`${width}px`,
      height:`${height}px`,
      color:node.textColor,
      fontFamily:
        node.fontFamily||
        A.defaults.node.fontFamily,
      fontSize:
        `${Math.max(
          12,
          node.fontSize*A.state.zoom
        )}px`,
      fontWeight:
        node.bold
          ? "600"
          : "400",
      fontStyle:
        node.italic
          ? "italic"
          : "normal",
      textAlign:
        node.textAlign||
        "center"
    });

    let finished=false;

    const finish=(save)=>{
      if(finished){
        return;
      }

      finished=true;

      const next=
        editor.value.trim()||
        "Yeni kutu";

      editor.remove();

      if(!save||next===node.text){
        A.render();
        return;
      }

      A.pushHistory();
      node.text=next;
      A.render();
      A.scheduleSave();

      A.setStatus(
        "Kutu metni güncellendi"
      );
    };

    editor.addEventListener(
      "pointerdown",
      (event)=>{
        event.stopPropagation();
      }
    );

    editor.addEventListener(
      "keydown",
      (event)=>{
        event.stopPropagation();

        if(event.key==="Escape"){
          event.preventDefault();
          finish(false);
        }else if(
          event.key==="Enter"&&
          !event.shiftKey&&
          !event.isComposing
        ){
          event.preventDefault();
          finish(true);
        }
      }
    );

    editor.addEventListener(
      "blur",
      ()=>{
        finish(true);
      }
    );

    A.shell.append(editor);

    requestAnimationFrame(()=>{
      editor.focus();
      editor.select();
    });
  };

  A.deleteSelection=()=>{
    const ids=A.selectedNodeIds();

    if(
      !ids.length&&
      !A.state.selectedEdge
    ){
      return;
    }

    A.pushHistory();

    if(ids.length){
      const chosen=new Set(ids);

      A.state.nodes=
        A.state.nodes.filter(
          (node)=>{
            return !chosen.has(node.id);
          }
        );

      A.state.edges=
        A.state.edges.filter(
          (edge)=>{
            return (
              !chosen.has(edge.from)&&
              !chosen.has(edge.to)
            );
          }
        );

      A.state.selectedNode=null;
      A.state.selectedNodes=[];
    }else{
      A.state.edges=
        A.state.edges.filter(
          (edge)=>{
            return (
              edge.id!==
              A.state.selectedEdge
            );
          }
        );

      A.state.selectedEdge=null;
    }

    A.render();
    A.scheduleSave();
    A.setStatus("Seçim silindi");
  };

  A.duplicateSelected=()=>{
    const nodes=
      A.selectedNodeObjects();

    if(!nodes.length){
      return;
    }

    A.pushHistory();

    const idMap=new Map();

    const copies=nodes.map((node)=>{
      const copy={
        ...node,
        id:A.uid("n"),
        x:node.x+30,
        y:node.y+30
      };

      idMap.set(node.id,copy.id);
      return copy;
    });

    const edges=
      A.state.edges
        .filter((edge)=>{
          return (
            idMap.has(edge.from)&&
            idMap.has(edge.to)
          );
        })
        .map((edge)=>({
          ...edge,
          id:A.uid("e"),
          from:idMap.get(edge.from),
          to:idMap.get(edge.to)
        }));

    A.state.nodes.push(...copies);
    A.state.edges.push(...edges);

    A.setNodeSelection(
      copies.map((node)=>node.id)
    );

    A.render();
    A.scheduleSave();
  };

  A.updateSelected=(
    property,
    value
  )=>{
    const nodes=
      A.selectedNodeObjects();

    if(!nodes.length){
      return;
    }

    A.pushHistory();

    nodes.forEach((node)=>{
      node[property]=value;
    });

    A.render();
    A.scheduleSave();
  };

  A.updateEdge=(
    property,
    value
  )=>{
    const edge=A.getEdge(
      A.state.selectedEdge
    );

    if(!edge){
      return;
    }

    A.pushHistory();
    edge[property]=value;
    A.render();
    A.scheduleSave();
  };

  A.updateStroke=(value)=>{
    if(A.selectedNodeIds().length){
      A.updateSelected(
        "stroke",
        value
      );
    }else if(A.state.selectedEdge){
      A.updateEdge(
        "color",
        value
      );
    }
  };

  A.updateLineWidth=(
    value,
    {
      history=true,
      save=true,
      render=true
    }={}
  )=>{
    const width=Math.max(
      .5,
      Math.min(
        50,
        Number(value)||1
      )
    );

    const nodes=
      A.selectedNodeObjects();

    const edge=A.getEdge(
      A.state.selectedEdge
    );

    if(!nodes.length&&!edge){
      return;
    }

    if(history){
      A.pushHistory();
    }

    nodes.forEach((node)=>{
      node.strokeWidth=width;
    });

    if(edge){
      edge.width=width;
    }

    A.syncLineWidthControls?.(width);

    if(render){
      A.render();
    }

    if(save){
      A.scheduleSave();
    }
  };

  A.updateCornerRadius=(value)=>{
    if(A.selectedNodeIds().length){
      A.updateSelected(
        "cornerRadius",
        value
      );
    }else if(A.state.selectedEdge){
      A.updateEdge(
        "cornerRadius",
        value
      );
    }
  };

  A.autoLayout=()=>{
    if(A.state.nodes.length<2){
      return;
    }

    A.pushHistory();

    const incoming=new Map(
      A.state.nodes.map(
        (node)=>[node.id,0]
      )
    );

    const outgoing=new Map(
      A.state.nodes.map(
        (node)=>[node.id,[]]
      )
    );

    A.state.edges.forEach((edge)=>{
      if(
        incoming.has(edge.to)&&
        outgoing.has(edge.from)
      ){
        incoming.set(
          edge.to,
          incoming.get(edge.to)+1
        );

        outgoing
          .get(edge.from)
          .push(edge.to);
      }
    });

    const level=new Map();

    const queue=A.state.nodes
      .filter((node)=>{
        return incoming.get(node.id)===0;
      })
      .map((node)=>node.id);

    queue.forEach((id)=>{
      level.set(id,0);
    });

    while(queue.length){
      const id=queue.shift();

      outgoing.get(id).forEach((next)=>{
        level.set(
          next,
          Math.max(
            level.get(next)||0,
            (level.get(id)||0)+1
          )
        );

        incoming.set(
          next,
          incoming.get(next)-1
        );

        if(incoming.get(next)===0){
          queue.push(next);
        }
      });
    }

    A.state.nodes.forEach((node)=>{
      if(!level.has(node.id)){
        level.set(node.id,0);
      }
    });

    const columns=new Map();

    A.state.nodes.forEach((node)=>{
      const current=level.get(node.id);

      if(!columns.has(current)){
        columns.set(current,[]);
      }

      columns.get(current).push(node);
    });

    [...columns.keys()]
      .sort((a,b)=>a-b)
      .forEach((current)=>{
        columns
          .get(current)
          .forEach((node,index)=>{
            node.x=100+current*230;
            node.y=100+index*115;
          });
      });

    A.render();
    A.fitDiagram();
    A.scheduleSave();

    A.setStatus(
      "Diyagram otomatik dizildi"
    );
  };

  A.registerInteractions=()=>{
    A.svg.addEventListener(
      "pointerdown",
      (event)=>{
        if(
          event.target.closest?.(
            "[data-node-id],"+
            "[data-edge-id],"+
            "[data-port],"+
            "[data-edge-endpoint]"
          )
        ){
          return;
        }

        A.runtime.lastNodePress={
          id:null,
          at:0
        };

        if(A.state.connectMode){
          A.state.connectSource=null;
          A.state.connectMode=false;
          A.updateToolbar();
          return;
        }

        if(
          event.button===1||
          A.runtime.spaceDown
        ){
          A.runtime.drag={
            type:"pan",
            clientX:event.clientX,
            clientY:event.clientY,
            panX:A.state.panX,
            panY:A.state.panY
          };

          A.svg.classList.add(
            "is-panning"
          );

          A.svg.setPointerCapture(
            event.pointerId
          );
        }else if(event.button===0){
          const start=
            A.worldPoint(event);

          const base=event.shiftKey
            ? A.selectedNodeIds()
            : [];

          if(!event.shiftKey){
            A.setNodeSelection([]);
          }

          A.state.selectedEdge=null;

          A.runtime.drag={
            type:"marquee",
            start,
            current:start,
            base,
            additive:event.shiftKey
          };

          A.svg.setPointerCapture(
            event.pointerId
          );
        }

        A.render();
      }
    );

    A.svg.addEventListener(
      "pointermove",
      pointerMove
    );

    A.svg.addEventListener(
      "pointerup",
      pointerUp
    );

    A.svg.addEventListener(
      "pointercancel",
      pointerUp
    );

    A.svg.addEventListener(
      "dblclick",
      (event)=>{
        if(
          event.target===A.svg||
          event.target.id==="ae-grid"
        ){
          const point=
            A.worldPoint(event);

          A.addNode(
            "rect",
            point.x-65,
            point.y-31
          );
        }
      }
    );

    A.svg.addEventListener(
      "wheel",
      (event)=>{
        event.preventDefault();

        A.zoomAt(
          event.deltaY<0 ? 1.1 : .9,
          event.clientX,
          event.clientY
        );
      },
      {
        passive:false
      }
    );

    A.shell.addEventListener(
      "dragover",
      (event)=>{
        event.preventDefault();
      }
    );

    A.shell.addEventListener(
      "drop",
      (event)=>{
        event.preventDefault();

        const type=
          event.dataTransfer.getData(
            "application/x-akis-shape"
          );

        if(type){
          const point=
            A.worldPoint(event);

          A.addNode(
            type,
            point.x-65,
            point.y-31,
            A.defaultShapeText[type]??
              "Yeni kutu"
          );
        }
      }
    );

    A.root.addEventListener(
      "keydown",
      (event)=>{
        const editing=[
          "INPUT",
          "SELECT",
          "TEXTAREA"
        ].includes(
          document.activeElement.tagName
        );

        const mod=
          event.ctrlKey||
          event.metaKey;

        if(
          event.code==="Space"&&
          !editing
        ){
          A.runtime.spaceDown=true;
          event.preventDefault();
        }

        if(editing){
          return;
        }

        if(
          event.key==="Delete"||
          event.key==="Backspace"
        ){
          event.preventDefault();
          A.deleteSelection();
        }else if(
          mod&&
          event.key.toLowerCase()==="z"
        ){
          event.preventDefault();

          if(event.shiftKey){
            A.redo();
          }else{
            A.undo();
          }
        }else if(
          mod&&
          event.key.toLowerCase()==="y"
        ){
          event.preventDefault();
          A.redo();
        }else if(
          mod&&
          event.key.toLowerCase()==="d"
        ){
          event.preventDefault();
          A.duplicateSelected();
        }else if(
          mod&&
          event.key.toLowerCase()==="a"
        ){
          event.preventDefault();

          A.setNodeSelection(
            A.state.nodes.map(
              (node)=>node.id
            )
          );

          A.render();

          A.setStatus(
            `${A.state.nodes.length} `+
            `kutu seçildi`
          );
        }else if(
          mod&&
          event.key.toLowerCase()==="c"
        ){
          const nodes=
            A.selectedNodeObjects();

          const chosen=new Set(
            nodes.map((node)=>node.id)
          );

          if(nodes.length){
            A.runtime.clipboard={
              nodes:nodes.map(
                (node)=>({...node})
              ),
              edges:A.state.edges
                .filter((edge)=>{
                  return (
                    chosen.has(edge.from)&&
                    chosen.has(edge.to)
                  );
                })
                .map(
                  (edge)=>({...edge})
                )
            };
          }
        }else if(
          mod&&
          event.key.toLowerCase()==="v"&&
          A.runtime.clipboard?.nodes?.length
        ){
          A.pushHistory();

          const idMap=new Map();

          const nodes=
            A.runtime.clipboard.nodes
              .map((node)=>{
                const copy={
                  ...node,
                  id:A.uid("n"),
                  x:node.x+35,
                  y:node.y+35
                };

                idMap.set(
                  node.id,
                  copy.id
                );

                return copy;
              });

          const edges=
            (
              A.runtime.clipboard.edges||
              []
            ).map((edge)=>({
              ...edge,
              id:A.uid("e"),
              from:idMap.get(edge.from),
              to:idMap.get(edge.to)
            }));

          A.state.nodes.push(...nodes);
          A.state.edges.push(...edges);

          A.setNodeSelection(
            nodes.map((node)=>node.id)
          );

          A.runtime.clipboard={
            nodes:nodes.map(
              (node)=>({...node})
            ),
            edges:edges.map(
              (edge)=>({...edge})
            )
          };

          A.render();
          A.scheduleSave();
        }else if(
          mod&&
          event.key==="0"
        ){
          event.preventDefault();
          A.fitDiagram();
        }else if(
          event.key==="Escape"
        ){
          A.state.connectMode=false;
          A.state.connectSource=null;
          A.runtime.drag=null;
          A.closeDropdowns?.();
          A.render();
        }else if(
          [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown"
          ].includes(event.key)&&
          A.selectedNodeIds().length
        ){
          event.preventDefault();
          A.pushHistory();

          const step=
            event.shiftKey ? 10 : 1;

          A.selectedNodeObjects()
            .forEach((node)=>{
              if(event.key==="ArrowLeft"){
                node.x-=step;
              }

              if(event.key==="ArrowRight"){
                node.x+=step;
              }

              if(event.key==="ArrowUp"){
                node.y-=step;
              }

              if(event.key==="ArrowDown"){
                node.y+=step;
              }
            });

          A.render();
          A.scheduleSave();
        }
      }
    );

    A.root.addEventListener(
      "keyup",
      (event)=>{
        if(event.code==="Space"){
          A.runtime.spaceDown=false;
        }
      }
    );

    window.addEventListener(
      "blur",
      ()=>{
        A.runtime.spaceDown=false;
      }
    );
  };
})();