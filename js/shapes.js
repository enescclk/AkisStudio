(() => {
  "use strict";

  const A=window.AkisStudio;

  A.circuitTypes=new Set([
    "resistor","capacitor","inductor","diode","led",
    "transistor-npn","transistor-pnp","opamp","ground","vcc",
    "battery","switch","motor","lamp","fuse","relay","transformer",
    "voltmeter","ammeter","ac-source","dc-source"
  ]);

  A.defaultShapeText={
    text:"Metin",
    rect:"Yeni işlem",
    rounded:"Başlangıç / Bitiş",
    terminator:"Başlangıç / Bitiş",
    ellipse:"Bağlantı",
    diamond:"Karar?",
    parallelogram:"Girdi / Çıktı",
    document:"Belge",
    cylinder:"Veri",
    predefined:"Alt işlem",
    note:"Not",
    table:"Tablo",
    code:"Kod",
    hexagon:"Hazırlık",
    trapezoid:"Manuel işlem",
    delay:"Gecikme",
    triangle:"",
    pentagon:"",
    octagon:"",
    plus:"",
    cloud:"Bulut",
    star:"",
    lightning:"",
    "arrow-right":"",
    "arrow-left":"",
    "arrow-up":"",
    "arrow-down":"",
    resistor:"R1",
    capacitor:"C1",
    inductor:"L1",
    diode:"D1",
    led:"LED1",
    "transistor-npn":"Q1 NPN",
    "transistor-pnp":"Q1 PNP",
    opamp:"U1",
    ground:"GND",
    vcc:"VCC",
    battery:"BAT1",
    switch:"SW1",
    motor:"M1",
    lamp:"L1",
    fuse:"F1",
    relay:"K1",
    transformer:"T1",
    voltmeter:"V",
    ammeter:"A",
    "ac-source":"AC",
    "dc-source":"DC"
  };

  A.isCircuitNode=(node)=>{
    return Boolean(
      node &&
      A.circuitTypes.has(node.type)
    );
  };

  A.wrapLines=(text,node)=>{
    const raw=String(text||"").split("\n");

    const approximate=Math.max(
      5,
      Math.floor(node.w/(node.fontSize*.58))
    );

    const lines=[];

    raw.forEach((paragraph)=>{
      const words=paragraph
        .split(/\s+/)
        .filter(Boolean);

      if(!words.length){
        lines.push("");
        return;
      }

      let line="";

      words.forEach((word)=>{
        const next=line
          ? `${line} ${word}`
          : word;

        if(next.length>approximate&&line){
          lines.push(line);
          line=word;
        }else{
          line=next;
        }
      });

      if(line){
        lines.push(line);
      }
    });

    return lines.slice(
      0,
      Math.max(
        1,
        Math.floor(node.h/(node.fontSize*1.25))
      )
    );
  };

  const starPoints=(width,height,count=5)=>{
    const points=[];
    const outer=Math.min(width,height)/2;
    const inner=outer*.44;

    for(let index=0;index<count*2;index+=1){
      const angle=
        -Math.PI/2+
        index*Math.PI/count;

      const radius=
        index%2===0
          ? outer
          : inner;

      points.push(
        `${width/2+Math.cos(angle)*radius},`+
        `${height/2+Math.sin(angle)*radius}`
      );
    }

    return points.join(" ");
  };

  const circuitShape=(node)=>{
    if(!A.isCircuitNode(node)){
      return null;
    }

    const w=node.w;
    const y=Math.min(27,node.h*.38);
    const stroke=node.stroke||A.defaults.node.stroke;
    const sw=node.strokeWidth||1.5;

    const group=A.el("g",{
      class:"ae-circuit-shape"
    });

    group.append(
      A.el("rect",{
        width:w,
        height:node.h,
        fill:"transparent",
        stroke:"none"
      })
    );

    const path=(d,extra={})=>{
      return A.el("path",{
        d,
        fill:"none",
        stroke,
        "stroke-width":sw,
        "stroke-linecap":"round",
        "stroke-linejoin":"round",
        ...extra
      });
    };

    const line=(x1,y1,x2,y2,extra={})=>{
      return A.el("line",{
        x1,
        y1,
        x2,
        y2,
        stroke,
        "stroke-width":sw,
        "stroke-linecap":"round",
        ...extra
      });
    };

    const circle=(cx,cy,r,extra={})=>{
      return A.el("circle",{
        cx,
        cy,
        r,
        fill:"none",
        stroke,
        "stroke-width":sw,
        ...extra
      });
    };

    const glyph=(text,x,gy,size=15)=>{
      const item=A.el("text",{
        x,
        y:gy,
        fill:stroke,
        "font-size":size,
        "font-family":
          node.fontFamily||
          A.defaults.node.fontFamily,
        "font-weight":"600",
        "text-anchor":"middle",
        "dominant-baseline":"middle",
        "pointer-events":"none"
      });

      item.textContent=text;
      return item;
    };

    if(node.type==="resistor"){
      group.append(
        path(
          `M0 ${y} `+
          `H${w*.16} `+
          `L${w*.22} ${y-9} `+
          `L${w*.3} ${y+9} `+
          `L${w*.38} ${y-9} `+
          `L${w*.46} ${y+9} `+
          `L${w*.54} ${y-9} `+
          `L${w*.62} ${y+9} `+
          `L${w*.7} ${y-9} `+
          `L${w*.76} ${y} `+
          `H${w}`
        )
      );
    }else if(node.type==="capacitor"){
      group.append(
        line(0,y,w*.43,y),
        line(w*.43,y-17,w*.43,y+17),
        line(w*.57,y-17,w*.57,y+17),
        line(w*.57,y,w,y)
      );
    }else if(node.type==="inductor"){
      group.append(
        path(
          `M0 ${y} H${w*.18} `+
          `C${w*.18} ${y-13},${w*.3} ${y-13},${w*.3} ${y} `+
          `C${w*.3} ${y-13},${w*.42} ${y-13},${w*.42} ${y} `+
          `C${w*.42} ${y-13},${w*.54} ${y-13},${w*.54} ${y} `+
          `C${w*.54} ${y-13},${w*.66} ${y-13},${w*.66} ${y} `+
          `C${w*.66} ${y-13},${w*.78} ${y-13},${w*.78} ${y} `+
          `H${w}`
        )
      );
    }else if(
      node.type==="diode"||
      node.type==="led"
    ){
      group.append(
        line(0,y,w*.35,y)
      );

      group.append(
        A.el("polygon",{
          points:
            `${w*.35},${y-14} `+
            `${w*.62},${y} `+
            `${w*.35},${y+14}`,
          fill:"none",
          stroke,
          "stroke-width":sw,
          "stroke-linejoin":"round"
        })
      );

      group.append(
        line(w*.65,y-16,w*.65,y+16),
        line(w*.65,y,w,y)
      );

      if(node.type==="led"){
        group.append(
          path(
            `M${w*.58} ${y-18} `+
            `l10 -10 m-3 0 l3 0 l0 3 `+
            `M${w*.68} ${y-13} `+
            `l10 -10 m-3 0 l3 0 l0 3`,
            {
              "stroke-width":
                Math.max(1,sw*.85)
            }
          )
        );
      }
    }else if(
      node.type==="transistor-npn"||
      node.type==="transistor-pnp"
    ){
      group.append(
        circle(w*.5,y,23),
        line(0,y,w*.36,y),
        line(w*.43,y-13,w*.43,y+13)
      );

      group.append(
        line(w*.43,y-8,w*.7,y-22),
        line(w*.43,y+8,w*.7,y+22),
        line(w*.7,y-22,w,y-22),
        line(w*.7,y+22,w,y+22)
      );

      const arrowY=
        node.type==="transistor-npn"
          ? y+17
          : y+10;

      const direction=
        node.type==="transistor-npn"
          ? 1
          : -1;

      group.append(
        path(
          `M${w*.62} ${arrowY-direction*5} `+
          `l${direction*8} ${direction*5} `+
          `l${-direction*7} ${direction*3}`,
          {
            "stroke-width":
              Math.max(1,sw*.9)
          }
        )
      );
    }else if(node.type==="opamp"){
      group.append(
        line(0,y-12,w*.25,y-12),
        line(0,y+12,w*.25,y+12),
        line(w*.78,y,w,y)
      );

      group.append(
        A.el("polygon",{
          points:
            `${w*.25},${y-23} `+
            `${w*.25},${y+23} `+
            `${w*.78},${y}`,
          fill:"none",
          stroke,
          "stroke-width":sw,
          "stroke-linejoin":"round"
        })
      );

      group.append(
        glyph("−",w*.34,y-11,13),
        glyph("+",w*.34,y+12,13)
      );
    }else if(node.type==="ground"){
      group.append(
        line(w*.5,3,w*.5,y+3),
        line(w*.32,y+3,w*.68,y+3),
        line(w*.38,y+9,w*.62,y+9),
        line(w*.44,y+15,w*.56,y+15)
      );
    }else if(node.type==="vcc"){
      group.append(
        line(w*.5,y+18,w*.5,8),
        A.el("polygon",{
          points:
            `${w*.5},2 `+
            `${w*.42},12 `+
            `${w*.58},12`,
          fill:stroke,
          stroke
        })
      );
    }else if(node.type==="battery"){
      group.append(
        line(0,y,w*.38,y),
        line(w*.38,y-15,w*.38,y+15),
        line(w*.5,y-9,w*.5,y+9),
        line(w*.5,y,w*.62,y),
        line(w*.62,y-15,w*.62,y+15),
        line(w*.74,y-9,w*.74,y+9),
        line(w*.74,y,w,y)
      );
    }else if(node.type==="switch"){
      group.append(
        line(0,y,w*.32,y),
        circle(w*.32,y,3,{fill:stroke}),
        circle(w*.7,y,3,{fill:stroke}),
        line(w*.7,y,w,y),
        line(w*.34,y-1,w*.66,y-15)
      );
    }else if([
      "motor",
      "lamp",
      "voltmeter",
      "ammeter",
      "ac-source",
      "dc-source"
    ].includes(node.type)){
      group.append(
        line(0,y,w*.28,y),
        circle(w*.5,y,22),
        line(w*.72,y,w,y)
      );

      const symbols={
        motor:"M",
        lamp:"×",
        voltmeter:"V",
        ammeter:"A",
        "ac-source":"∿",
        "dc-source":"⎓"
      };

      group.append(
        glyph(
          symbols[node.type],
          w*.5,
          y+1,
          node.type==="lamp" ? 25 : 16
        )
      );
    }else if(node.type==="fuse"){
      group.append(
        line(0,y,w*.3,y),
        A.el("rect",{
          x:w*.3,
          y:y-9,
          width:w*.4,
          height:18,
          rx:4,
          fill:"none",
          stroke,
          "stroke-width":sw
        }),
        line(w*.7,y,w,y)
      );
    }else if(node.type==="relay"){
      group.append(
        line(0,y+11,w*.2,y+11),
        path(
          `M${w*.2} ${y+11} `+
          `C${w*.2} ${y-1},${w*.32} ${y-1},${w*.32} ${y+11} `+
          `C${w*.32} ${y-1},${w*.44} ${y-1},${w*.44} ${y+11} `+
          `H${w*.55}`
        )
      );

      group.append(
        line(w*.55,y+11,w*.66,y+11),
        circle(w*.66,y-9,2.8,{fill:stroke}),
        circle(w*.88,y-9,2.8,{fill:stroke}),
        line(w*.68,y-10,w*.84,y-20),
        line(w*.88,y-9,w,y-9)
      );
    }else if(node.type==="transformer"){
      group.append(
        line(0,y,w*.16,y),
        path(
          `M${w*.16} ${y} `+
          `C${w*.16} ${y-12},${w*.28} ${y-12},${w*.28} ${y} `+
          `C${w*.28} ${y-12},${w*.4} ${y-12},${w*.4} ${y}`
        )
      );

      group.append(
        line(w*.46,y-20,w*.46,y+20),
        line(w*.54,y-20,w*.54,y+20)
      );

      group.append(
        path(
          `M${w*.6} ${y} `+
          `C${w*.6} ${y-12},${w*.72} ${y-12},${w*.72} ${y} `+
          `C${w*.72} ${y-12},${w*.84} ${y-12},${w*.84} ${y} `+
          `H${w}`
        )
      );
    }

    return group;
  };

  A.makeShape=(node)=>{
    const circuit=circuitShape(node);

    if(circuit){
      return circuit;
    }

    const common={
      class:"ae-node-shape",
      fill:
        node.type==="text"
          ? "transparent"
          : node.fill,
      stroke:
        node.type==="text"
          ? "transparent"
          : node.stroke,
      "stroke-width":
        node.strokeWidth||1.5
    };

    if(node.type==="ellipse"){
      return A.el("ellipse",{
        ...common,
        cx:node.w/2,
        cy:node.h/2,
        rx:node.w/2,
        ry:node.h/2
      });
    }

    if(node.type==="diamond"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w/2},0 `+
          `${node.w},${node.h/2} `+
          `${node.w/2},${node.h} `+
          `0,${node.h/2}`
      });
    }

    if(node.type==="triangle"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w/2},0 `+
          `${node.w},${node.h} `+
          `0,${node.h}`
      });
    }

    if(node.type==="pentagon"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w/2},0 `+
          `${node.w},${node.h*.38} `+
          `${node.w*.82},${node.h} `+
          `${node.w*.18},${node.h} `+
          `0,${node.h*.38}`
      });
    }

    if(node.type==="hexagon"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.22},0 `+
          `${node.w*.78},0 `+
          `${node.w},${node.h/2} `+
          `${node.w*.78},${node.h} `+
          `${node.w*.22},${node.h} `+
          `0,${node.h/2}`
      });
    }

    if(node.type==="octagon"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.28},0 `+
          `${node.w*.72},0 `+
          `${node.w},${node.h*.28} `+
          `${node.w},${node.h*.72} `+
          `${node.w*.72},${node.h} `+
          `${node.w*.28},${node.h} `+
          `0,${node.h*.72} `+
          `0,${node.h*.28}`
      });
    }

    if(node.type==="parallelogram"){
      return A.el("polygon",{
        ...common,
        points:
          `18,0 `+
          `${node.w},0 `+
          `${node.w-18},${node.h} `+
          `0,${node.h}`
      });
    }

    if(node.type==="trapezoid"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.18},0 `+
          `${node.w*.82},0 `+
          `${node.w},${node.h} `+
          `0,${node.h}`
      });
    }

    if(node.type==="document"){
      return A.el("path",{
        ...common,
        d:
          `M0 0 H${node.w} `+
          `V${node.h-10} `+
          `Q${node.w*.75} ${node.h-21},`+
          `${node.w*.5} ${node.h-10} `+
          `Q${node.w*.25} ${node.h+1},`+
          `0 ${node.h-10} Z`
      });
    }

    if(node.type==="note"){
      return A.el("path",{
        ...common,
        d:
          `M0 0 `+
          `H${node.w-20} `+
          `L${node.w} 20 `+
          `V${node.h} `+
          `H0 Z `+
          `M${node.w-20} 0 `+
          `V20 H${node.w}`
      });
    }

    if(node.type==="cylinder"){
      return A.el("path",{
        ...common,
        d:
          `M0 10 `+
          `A${node.w/2} 10 0 0 1 ${node.w} 10 `+
          `V${node.h-10} `+
          `A${node.w/2} 10 0 0 1 0 ${node.h-10} `+
          `Z `+
          `M0 10 `+
          `A${node.w/2} 10 0 0 0 ${node.w} 10`
      });
    }

    if(node.type==="delay"){
      return A.el("path",{
        ...common,
        d:
          `M0 0 `+
          `H${node.w-node.h/2} `+
          `A${node.h/2} ${node.h/2} 0 0 1 `+
          `${node.w-node.h/2} ${node.h} `+
          `H0 Z`
      });
    }

    if(node.type==="star"){
      return A.el("polygon",{
        ...common,
        points:starPoints(node.w,node.h)
      });
    }

    if(node.type==="arrow-right"){
      return A.el("polygon",{
        ...common,
        points:
          `0,${node.h*.25} `+
          `${node.w*.62},${node.h*.25} `+
          `${node.w*.62},0 `+
          `${node.w},${node.h/2} `+
          `${node.w*.62},${node.h} `+
          `${node.w*.62},${node.h*.75} `+
          `0,${node.h*.75}`
      });
    }

    if(node.type==="arrow-left"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w},${node.h*.25} `+
          `${node.w*.38},${node.h*.25} `+
          `${node.w*.38},0 `+
          `0,${node.h/2} `+
          `${node.w*.38},${node.h} `+
          `${node.w*.38},${node.h*.75} `+
          `${node.w},${node.h*.75}`
      });
    }

    if(node.type==="arrow-up"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.25},${node.h} `+
          `${node.w*.25},${node.h*.38} `+
          `0,${node.h*.38} `+
          `${node.w/2},0 `+
          `${node.w},${node.h*.38} `+
          `${node.w*.75},${node.h*.38} `+
          `${node.w*.75},${node.h}`
      });
    }

    if(node.type==="arrow-down"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.25},0 `+
          `${node.w*.75},0 `+
          `${node.w*.75},${node.h*.62} `+
          `${node.w},${node.h*.62} `+
          `${node.w/2},${node.h} `+
          `0,${node.h*.62} `+
          `${node.w*.25},${node.h*.62}`
      });
    }

    if(node.type==="plus"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.35},0 `+
          `${node.w*.65},0 `+
          `${node.w*.65},${node.h*.35} `+
          `${node.w},${node.h*.35} `+
          `${node.w},${node.h*.65} `+
          `${node.w*.65},${node.h*.65} `+
          `${node.w*.65},${node.h} `+
          `${node.w*.35},${node.h} `+
          `${node.w*.35},${node.h*.65} `+
          `0,${node.h*.65} `+
          `0,${node.h*.35} `+
          `${node.w*.35},${node.h*.35}`
      });
    }

    if(node.type==="cloud"){
      return A.el("path",{
        ...common,
        d:
          `M${node.w*.2} ${node.h*.78} `+
          `C${node.w*.04} ${node.h*.78},`+
          `0 ${node.h*.58},`+
          `${node.w*.12} ${node.h*.48} `+
          `C${node.w*.06} ${node.h*.26},`+
          `${node.w*.31} ${node.h*.16},`+
          `${node.w*.45} ${node.h*.3} `+
          `C${node.w*.56} ${node.h*.04},`+
          `${node.w*.88} ${node.h*.16},`+
          `${node.w*.85} ${node.h*.42} `+
          `C${node.w} ${node.h*.45},`+
          `${node.w} ${node.h*.74},`+
          `${node.w*.8} ${node.h*.78} Z`
      });
    }

    if(node.type==="lightning"){
      return A.el("polygon",{
        ...common,
        points:
          `${node.w*.55},0 `+
          `${node.w*.2},${node.h*.55} `+
          `${node.w*.48},${node.h*.55} `+
          `${node.w*.35},${node.h} `+
          `${node.w*.8},${node.h*.4} `+
          `${node.w*.53},${node.h*.4}`
      });
    }

    if(node.type==="predefined"){
      const group=A.el("g");

      group.append(
        A.el("rect",{
          ...common,
          width:node.w,
          height:node.h,
          rx:node.cornerRadius||1
        })
      );

      group.append(
        A.el("path",{
          d:
            `M12 0 V${node.h} `+
            `M${node.w-12} 0 V${node.h}`,
          fill:"none",
          stroke:node.stroke,
          "stroke-width":
            node.strokeWidth||1.5
        })
      );

      return group;
    }

    if(node.type==="table"){
      const group=A.el("g");

      group.append(
        A.el("rect",{
          ...common,
          width:node.w,
          height:node.h
        })
      );

      group.append(
        A.el("path",{
          d:
            `M0 ${node.h/3} H${node.w} `+
            `M0 ${node.h*2/3} H${node.w} `+
            `M${node.w/3} 0 V${node.h} `+
            `M${node.w*2/3} 0 V${node.h}`,
          fill:"none",
          stroke:node.stroke,
          "stroke-width":
            node.strokeWidth||1.5
        })
      );

      return group;
    }

    const radius=
      node.type==="rounded"||
      node.type==="terminator"
        ? Math.min(node.h/2,node.w/2)
        : Number(node.cornerRadius||1);

    return A.el("rect",{
      ...common,
      width:node.w,
      height:node.h,
      rx:radius
    });
  };
})();