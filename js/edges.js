(() => {
  "use strict";

  const A=window.AkisStudio;

  A.powerRole=(node)=>{
    if(!node){
      return "";
    }

    const text=String(node.text||"")
      .trim()
      .toLocaleUpperCase("tr-TR");

    if(
      node.type==="vcc"||
      /\b(VCC|VDD|\+5V|\+3V3|3V3)\b/.test(text)
    ){
      return "vcc";
    }

    if(
      node.type==="ground"||
      /\b(GND|GROUND|TOPRAK|0V)\b/.test(text)
    ){
      return "ground";
    }

    return "";
  };

  A.edgeStyleForNodes=(from,to)=>{
    const fromRole=A.powerRole(from);
    const toRole=A.powerRole(to);

    let color=A.defaults.edge.color;

    if(fromRole==="vcc"){
      color="#ef4444";
    }else if(fromRole==="ground"){
      color="#111111";
    }else if(toRole==="vcc"){
      color="#ef4444";
    }else if(toRole==="ground"){
      color="#111111";
    }

    return {
      ...A.defaults.edge,
      color,
      endArrow:
        A.isCircuitNode(from)||
        A.isCircuitNode(to)
          ? "none"
          : A.defaults.edge.endArrow
    };
  };

  const roundedPath=(points,radius)=>{
    if(points.length<3||radius<=0){
      return (
        `M `+
        points
          .map((point)=>`${point.x} ${point.y}`)
          .join(" L ")
      );
    }

    let d=`M ${points[0].x} ${points[0].y}`;

    for(
      let index=1;
      index<points.length-1;
      index+=1
    ){
      const previous=points[index-1];
      const current=points[index];
      const next=points[index+1];

      const beforeLength=
        Math.hypot(
          current.x-previous.x,
          current.y-previous.y
        )||1;

      const afterLength=
        Math.hypot(
          next.x-current.x,
          next.y-current.y
        )||1;

      const amount=Math.min(
        radius,
        beforeLength/2,
        afterLength/2
      );

      const before={
        x:
          current.x+
          (previous.x-current.x)/
          beforeLength*
          amount,
        y:
          current.y+
          (previous.y-current.y)/
          beforeLength*
          amount
      };

      const after={
        x:
          current.x+
          (next.x-current.x)/
          afterLength*
          amount,
        y:
          current.y+
          (next.y-current.y)/
          afterLength*
          amount
      };

      d+=
        ` L ${before.x} ${before.y}`+
        ` Q ${current.x} ${current.y}`+
        ` ${after.x} ${after.y}`;
    }

    const last=points[points.length-1];

    return `${d} L ${last.x} ${last.y}`;
  };

  A.edgePath=(edge)=>{
    const from=A.getNode(edge.from);
    const to=A.getNode(edge.to);

    if(!from||!to){
      return "";
    }

    const sides=
      edge.fromSide&&edge.toSide
        ? [edge.fromSide,edge.toSide]
        : A.bestSides(from,to);

    const start=A.portPoint(from,sides[0]);
    const end=A.portPoint(to,sides[1]);

    if(edge.routing==="straight"){
      return (
        `M ${start.x} ${start.y} `+
        `L ${end.x} ${end.y}`
      );
    }

    if(edge.routing==="curve"){
      if(
        sides[0]==="left"||
        sides[0]==="right"
      ){
        const offset=Math.max(
          50,
          Math.abs(end.x-start.x)*.45
        );

        const direction=
          sides[0]==="right"
            ? 1
            : -1;

        return (
          `M ${start.x} ${start.y} `+
          `C ${start.x+offset*direction} ${start.y}, `+
          `${end.x-offset*direction} ${end.y}, `+
          `${end.x} ${end.y}`
        );
      }

      const offset=Math.max(
        50,
        Math.abs(end.y-start.y)*.45
      );

      const direction=
        sides[0]==="bottom"
          ? 1
          : -1;

      return (
        `M ${start.x} ${start.y} `+
        `C ${start.x} ${start.y+offset*direction}, `+
        `${end.x} ${end.y-offset*direction}, `+
        `${end.x} ${end.y}`
      );
    }

    let points;

    if(
      sides[0]==="left"||
      sides[0]==="right"
    ){
      const middle=(start.x+end.x)/2;

      points=[
        start,
        {
          x:middle,
          y:start.y
        },
        {
          x:middle,
          y:end.y
        },
        end
      ];
    }else{
      const middle=(start.y+end.y)/2;

      points=[
        start,
        {
          x:start.x,
          y:middle
        },
        {
          x:end.x,
          y:middle
        },
        end
      ];
    }

    return roundedPath(
      points,
      Number(edge.cornerRadius||0)
    );
  };

  const markerId=(type,size)=>{
    return `ae-marker-${type}-${size||1}`;
  };

  A.ensureMarkerVariants=()=>{
    const defs=A.$("#ae-canvas defs");

    if(!defs){
      return;
    }

    [.75,1,1.5,2].forEach((size)=>{
      [
        "arrow",
        "open",
        "triangle",
        "diamond",
        "circle",
        "bar"
      ].forEach((type)=>{
        const id=markerId(type,size);

        if(document.getElementById(id)){
          return;
        }

        const source=
          document.getElementById(
            `ae-marker-${type}`
          );

        if(!source){
          return;
        }

        const marker=source.cloneNode(true);
        marker.id=id;

        marker.setAttribute(
          "markerWidth",
          String(
            (
              Number(
                source.getAttribute("markerWidth")
              )||8
            )*size
          )
        );

        marker.setAttribute(
          "markerHeight",
          String(
            (
              Number(
                source.getAttribute("markerHeight")
              )||8
            )*size
          )
        );

        defs.append(marker);
      });
    });
  };

  A.hitNode=(point,excludeId)=>{
    const items=A.state.nodes.filter((node)=>{
      return (
        node.id!==excludeId &&
        point.x>=node.x &&
        point.x<=node.x+node.w &&
        point.y>=node.y &&
        point.y<=node.y+node.h
      );
    });

    return items[items.length-1]||null;
  };

  A.nearestSide=(node,point)=>{
    return [
      "left",
      "right",
      "top",
      "bottom"
    ]
      .map((side)=>{
        const port=A.portPoint(node,side);

        return {
          side,
          distance:Math.hypot(
            point.x-port.x,
            point.y-port.y
          )
        };
      })
      .sort((first,second)=>{
        return first.distance-second.distance;
      })[0].side;
  };

  A.renderEdges=()=>{
    A.edgesLayer.replaceChildren();

    A.state.edges.forEach((edge)=>{
      const d=A.edgePath(edge);

      if(!d){
        return;
      }

      const group=A.el("g",{
        "data-edge-id":edge.id
      });

      const hit=A.el("path",{
        class:"ae-edge-hit",
        d
      });

      const path=A.el("path",{
        class:
          `ae-edge`+
          (
            A.state.selectedEdge===edge.id
              ? " selected"
              : ""
          ),
        d,
        stroke:
          edge.color||
          A.defaults.edge.color,
        "stroke-width":
          edge.width||2,
        "stroke-linecap":
          edge.lineStyle==="dotted"
            ? "round"
            : "butt",
        "marker-start":
          edge.startArrow&&
          edge.startArrow!=="none"
            ? `url(#${markerId(
                edge.startArrow,
                edge.endpointSize
              )})`
            : "",
        "marker-end":
          edge.endArrow&&
          edge.endArrow!=="none"
            ? `url(#${markerId(
                edge.endArrow,
                edge.endpointSize
              )})`
            : ""
      });

      const dash={
        dashed:"9 6",
        dotted:"1 6",
        dashdot:"10 5 2 5"
      };

      if(dash[edge.lineStyle]){
        path.setAttribute(
          "stroke-dasharray",
          dash[edge.lineStyle]
        );
      }

      group.append(hit,path);

      group.addEventListener(
        "pointerdown",
        (event)=>{
          event.stopPropagation();

          A.runtime.lastNodePress={
            id:null,
            at:0
          };

          A.state.selectedEdge=edge.id;
          A.state.selectedNode=null;
          A.state.selectedNodes=[];

          A.render();
        }
      );

      A.edgesLayer.append(group);
    });
  };
})();