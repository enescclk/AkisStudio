(() => {
  "use strict";

  const A=window.AkisStudio;
  A.svg=A.$("#ae-canvas");
  A.shell=A.$("#ae-canvas-shell");
  A.viewport=A.$("#ae-viewport");
  A.nodesLayer=A.$("#ae-nodes");
  A.edgesLayer=A.$("#ae-edges");
  A.overlayLayer=A.$("#ae-overlay");
  A.MIN_ZOOM=.08;
  A.MAX_ZOOM=4;

  A.installCanvasStyles=()=>{
    if(document.getElementById("ae-modular-canvas-styles"))return;
    const style=document.createElement("style");
    style.id="ae-modular-canvas-styles";
    style.textContent=`
      #akis-studio{--ae-grid-minor:light-dark(rgb(100 116 139 / 24%),rgb(148 163 184 / 18%));--ae-grid-medium:light-dark(rgb(71 85 105 / 46%),rgb(148 163 184 / 38%));--ae-grid-major:light-dark(rgb(51 65 85 / 62%),rgb(203 213 225 / 56%))}
      #akis-studio .ae-circuit-shape>*{vector-effect:non-scaling-stroke}
      #akis-studio .ae-edge-endpoint{fill:var(--card);stroke:var(--primary);stroke-width:2;vector-effect:non-scaling-stroke;cursor:crosshair;pointer-events:all}
      #akis-studio .ae-edge-endpoint.is-end{fill:var(--primary)}
      #akis-studio .ae-edge-bend-handle{fill:var(--card);stroke:var(--primary);stroke-width:2;vector-effect:non-scaling-stroke;cursor:move;pointer-events:all}
      #akis-studio .ae-edge-segment-handle{cursor:move;pointer-events:all}
      #akis-studio .ae-edge-segment-handle rect{fill:var(--primary);stroke:var(--card);stroke-width:1.5;vector-effect:non-scaling-stroke}
      #akis-studio .ae-group-selection{fill:color-mix(in srgb,var(--primary) 7%,transparent);stroke:var(--primary);stroke-width:1.6;stroke-dasharray:8 5;vector-effect:non-scaling-stroke;pointer-events:none}
      #akis-studio .ae-selection-member{fill:transparent;stroke:color-mix(in srgb,var(--primary) 72%,transparent);stroke-width:1;vector-effect:non-scaling-stroke;pointer-events:none}
      #akis-studio .ae-marquee-selection{fill:color-mix(in srgb,var(--primary) 11%,transparent);stroke:var(--primary);stroke-width:1.5;stroke-dasharray:7 4;vector-effect:non-scaling-stroke;pointer-events:none}
      #akis-studio .ae-inline-text-editor{position:absolute;z-index:40;min-width:120px;min-height:48px;resize:none;padding:8px;border:2px solid var(--primary);border-radius:8px;outline:none;color:var(--foreground);background:var(--glass-strong);box-shadow:0 10px 28px var(--glass-shadow),0 0 0 3px var(--ring);line-height:1.18;overflow:auto;user-select:text}
      @media(max-width:1680px){#akis-studio .ae-save-state{display:none}}
    `;
    document.head.append(style);
  };

  A.worldPoint=(event)=>{
    const rect=A.svg.getBoundingClientRect();
    return {
      x:(event.clientX-rect.left-A.state.panX)/A.state.zoom,
      y:(event.clientY-rect.top-A.state.panY)/A.state.zoom
    };
  };

  A.screenPoint=(point)=>({
    x:point.x*A.state.zoom+A.state.panX,
    y:point.y*A.state.zoom+A.state.panY
  });

  A.normalizedRect=(first,second)=>({
    x:Math.min(first.x,second.x),
    y:Math.min(first.y,second.y),
    w:Math.abs(second.x-first.x),
    h:Math.abs(second.y-first.y)
  });

  A.nodesInRect=(rect)=>{
    return A.state.nodes
      .filter((node)=>{
        return (
          node.x<rect.x+rect.w &&
          node.x+node.w>rect.x &&
          node.y<rect.y+rect.h &&
          node.y+node.h>rect.y
        );
      })
      .map((node)=>node.id);
  };

  A.renderNodes=()=>{
    A.nodesLayer.replaceChildren();

    A.state.nodes.forEach((node)=>{
      const group=A.el("g",{
        class:"ae-node",
        transform:`translate(${node.x} ${node.y})`,
        "data-node-id":node.id
      });

      group.append(A.makeShape(node));

      const circuit=A.isCircuitNode(node);
      const fontSize=circuit
        ? Math.min(Number(node.fontSize||14),13)
        : Number(node.fontSize||14);

      const lines=circuit
        ? String(node.text||"").split("\n").slice(0,1)
        : A.wrapLines(node.text,node);

      const align=circuit?"center":node.textAlign||"center";
      const anchor=align==="left"
        ?"start"
        :align==="right"
          ?"end"
          :"middle";

      const x=align==="left"
        ?10
        :align==="right"
          ?node.w-10
          :node.w/2;

      const text=A.el("text",{
        class:"ae-node-text",
        fill:node.textColor,
        "font-size":fontSize,
        "font-family":node.fontFamily||A.defaults.node.fontFamily,
        "font-weight":node.bold?600:400,
        "font-style":node.italic?"italic":"normal",
        "text-decoration":node.underline?"underline":"none",
        "text-anchor":anchor
      });

      const lineHeight=fontSize*1.18;
      const totalHeight=(lines.length-1)*lineHeight;

      let startY=circuit
        ?node.h-7
        :node.h/2-totalHeight/2;

      if(!circuit&&node.verticalAlign==="top"){
        startY=10+fontSize/2;
      }

      if(!circuit&&node.verticalAlign==="bottom"){
        startY=node.h-10-totalHeight-fontSize/2;
      }

      lines.forEach((line,index)=>{
        const tspan=A.el("tspan",{
          x,
          y:startY+index*lineHeight
        });

        tspan.textContent=line;
        text.append(tspan);
      });

      group.append(text);
      group.addEventListener("pointerdown",A.nodePointerDown);
      A.nodesLayer.append(group);
    });
  };

  A.renderOverlay=()=>{
    A.overlayLayer.replaceChildren();

    const drag=A.runtime.drag;

    if(drag?.type==="marquee"){
      const rectangle=A.normalizedRect(drag.start,drag.current);

      A.overlayLayer.append(
        A.el("rect",{
          class:"ae-marquee-selection",
          x:rectangle.x,
          y:rectangle.y,
          width:rectangle.w,
          height:rectangle.h
        })
      );
    }

    const selected=A.selectedNodeObjects();

    if(selected.length>1){
      selected.forEach((node)=>{
        A.overlayLayer.append(
          A.el("rect",{
            class:"ae-selection-member",
            x:node.x-3,
            y:node.y-3,
            width:node.w+6,
            height:node.h+6,
            rx:3
          })
        );
      });

      const nodeBounds=A.selectionBounds(selected);
      const edgePoints=A.selectedEdgeObjects()
        .flatMap((edge)=>A.edgePoints(edge));

      const bounds=edgePoints.length
        ?{
            x:Math.min(
              nodeBounds.x,
              ...edgePoints.map((point)=>point.x)
            ),
            y:Math.min(
              nodeBounds.y,
              ...edgePoints.map((point)=>point.y)
            ),
            w:0,
            h:0
          }
        :nodeBounds;

      if(edgePoints.length){
        const maxX=Math.max(
          nodeBounds.x+nodeBounds.w,
          ...edgePoints.map((point)=>point.x)
        );

        const maxY=Math.max(
          nodeBounds.y+nodeBounds.h,
          ...edgePoints.map((point)=>point.y)
        );

        bounds.w=maxX-bounds.x;
        bounds.h=maxY-bounds.y;
      }

      A.overlayLayer.append(
        A.el("rect",{
          class:"ae-group-selection",
          x:bounds.x-9,
          y:bounds.y-9,
          width:bounds.w+18,
          height:bounds.h+18,
          rx:4
        })
      );

      return;
    }

    const node=A.getNode(A.state.selectedNode);

    if(node){
      const group=A.el("g",{
        transform:`translate(${node.x} ${node.y})`
      });

      group.append(
        A.el("rect",{
          class:"ae-selection",
          x:-5,
          y:-5,
          width:node.w+10,
          height:node.h+10,
          rx:3
        })
      );

      ["top","right","bottom","left"].forEach((side)=>{
        const point=A.portPoint({
          x:0,
          y:0,
          w:node.w,
          h:node.h
        },side);

        const port=A.el("circle",{
          class:"ae-port",
          cx:point.x,
          cy:point.y,
          r:5.5,
          "data-port":side
        });

        port.addEventListener(
          "pointerdown",
          (event)=>A.startPortConnect(event,node,side)
        );

        group.append(port);
      });

      const resize=A.el("rect",{
        class:"ae-resize",
        x:node.w-5,
        y:node.h-5,
        width:10,
        height:10
      });

      resize.addEventListener(
        "pointerdown",
        (event)=>A.startResize(event,node)
      );

      group.append(resize);
      A.overlayLayer.append(group);
      return;
    }

    const edge=A.getEdge(A.state.selectedEdge);
    if(!edge)return;

    const from=A.getNode(edge.from);
    const to=A.getNode(edge.to);

    if(!from||!to)return;

    const sides=edge.fromSide&&edge.toSide
      ?[edge.fromSide,edge.toSide]
      :A.bestSides(from,to);

    const points=A.edgePoints(edge);

    points.slice(0,-1).forEach((point,index)=>{
      const next=points[index+1];

      if(Math.hypot(next.x-point.x,next.y-point.y)<24){
        return;
      }

      const middle={
        x:(point.x+next.x)/2,
        y:(point.y+next.y)/2
      };

      const angle=Math.atan2(
        next.y-point.y,
        next.x-point.x
      )*180/Math.PI;

      const handle=A.el("g",{
        class:"ae-edge-segment-handle",
        transform:`translate(${middle.x} ${middle.y}) rotate(${angle})`,
        "data-edge-segment":index
      });

      handle.append(
        A.el("rect",{
          x:-11,
          y:-4.5,
          width:22,
          height:9,
          rx:4.5
        })
      );

      handle.addEventListener(
        "pointerdown",
        (event)=>A.startEdgeSegmentDrag(event,edge,index,points)
      );

      A.overlayLayer.append(handle);
    });

    (edge.waypoints||[]).forEach((point,index)=>{
      const handle=A.el("circle",{
        class:"ae-edge-bend-handle",
        cx:point.x,
        cy:point.y,
        r:6,
        "data-edge-bend":index
      });

      handle.addEventListener(
        "pointerdown",
        (event)=>A.startEdgeBendDrag(event,edge,index)
      );

      handle.addEventListener("dblclick",(event)=>{
        event.stopPropagation();
        A.removeEdgeBend(edge,index);
      });

      A.overlayLayer.append(handle);
    });

    [
      ["start",A.portPoint(from,sides[0])],
      ["end",A.portPoint(to,sides[1])]
    ].forEach(([endpoint,point])=>{
      const handle=A.el("circle",{
        class:`ae-edge-endpoint is-${endpoint}`,
        cx:point.x,
        cy:point.y,
        r:7,
        "data-edge-endpoint":endpoint
      });

      handle.addEventListener(
        "pointerdown",
        (event)=>A.startEdgeEndpointDrag(event,edge,endpoint)
      );

      A.overlayLayer.append(handle);
    });
  };

  const setPattern=(patternSelector,pathSelector,size)=>{
    const pattern=A.$(patternSelector);
    const path=A.$(pathSelector);

    pattern?.setAttribute("width",size);
    pattern?.setAttribute("height",size);
    path?.setAttribute(
      "d",
      `M ${size} 0 L 0 0 0 ${size}`
    );
  };

  A.updateAdaptiveGrid=()=>{
    setPattern("#ae-minor-grid","#ae-grid-minor-path",20);
    setPattern("#ae-medium-grid","#ae-grid-medium-path",100);
    setPattern("#ae-major-grid","#ae-grid-major-path",500);

    [
      ["#ae-medium-grid-fill",100],
      ["#ae-major-grid-fill",500]
    ].forEach(([selector,size])=>{
      const item=A.$(selector);
      item?.setAttribute("width",size);
      item?.setAttribute("height",size);
    });

    const smooth=(value,start,end)=>{
      const amount=Math.max(
        0,
        Math.min(1,(value-start)/(end-start))
      );

      return amount*amount*(3-2*amount);
    };

    A.$("#ae-grid-minor-path").style.opacity=String(
      smooth(A.state.zoom,.42,.78)*.68
    );

    A.$("#ae-grid-medium-path").style.opacity=String(
      .24+smooth(A.state.zoom,.1,.38)*.58
    );

    A.$("#ae-grid-major-path").style.opacity="1";
  };

  A.updateTransform=()=>{
    A.updateAdaptiveGrid();

    A.viewport.setAttribute(
      "transform",
      `translate(${A.state.panX} ${A.state.panY}) scale(${A.state.zoom})`
    );

    A.$("#ae-zoom-label").textContent=
      `${Math.round(A.state.zoom*100)}%`;
  };

  A.render=()=>{
    A.renderEdges();
    A.renderNodes();
    A.renderOverlay();
    A.updateTransform();
    A.updateToolbar?.();
  };

  A.zoomAt=(factor,clientX,clientY)=>{
    const rect=A.svg.getBoundingClientRect();

    const screenX=clientX==null
      ?rect.width/2
      :clientX-rect.left;

    const screenY=clientY==null
      ?rect.height/2
      :clientY-rect.top;

    const worldX=(screenX-A.state.panX)/A.state.zoom;
    const worldY=(screenY-A.state.panY)/A.state.zoom;

    const next=Math.min(
      A.MAX_ZOOM,
      Math.max(A.MIN_ZOOM,A.state.zoom*factor)
    );

    A.state.panX=screenX-worldX*next;
    A.state.panY=screenY-worldY*next;
    A.state.zoom=next;

    A.updateTransform();
  };

  A.fitDiagram=()=>{
    if(!A.state.nodes.length){
      A.state.zoom=1;
      A.state.panX=40;
      A.state.panY=40;
      A.updateTransform();
      return;
    }

    const minX=Math.min(
      ...A.state.nodes.map((node)=>node.x)
    );

    const minY=Math.min(
      ...A.state.nodes.map((node)=>node.y)
    );

    const maxX=Math.max(
      ...A.state.nodes.map((node)=>node.x+node.w)
    );

    const maxY=Math.max(
      ...A.state.nodes.map((node)=>node.y+node.h)
    );

    const rect=A.svg.getBoundingClientRect();
    const padding=70;

    A.state.zoom=Math.min(
      1.35,
      Math.max(
        A.MIN_ZOOM,
        Math.min(
          (rect.width-padding*2)/(maxX-minX),
          (rect.height-padding*2)/(maxY-minY)
        )
      )
    );

    A.state.panX=
      (rect.width-(maxX-minX)*A.state.zoom)/2-
      minX*A.state.zoom;

    A.state.panY=
      (rect.height-(maxY-minY)*A.state.zoom)/2-
      minY*A.state.zoom;

    A.updateTransform();
  };

  A.installCanvasStyles();
})();