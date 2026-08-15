(() => {
  "use strict";

  const A=window.AkisStudio;
  const DEFAULT_WIDTH=272;
  const MIN_WIDTH=200;
  const MAX_WIDTH=420;

  const installStyles=()=>{
    if(document.getElementById("ae-modular-sidebar-styles"))return;

    const style=document.createElement("style");
    style.id="ae-modular-sidebar-styles";

    style.textContent=`
      #akis-studio .ae-palette{
        min-height:0!important;
        overflow-x:hidden!important;
        overflow-y:scroll!important;
        overscroll-behavior:contain;
        scrollbar-gutter:stable;
      }

      #akis-studio .ae-shape-grid,
      #akis-studio .ae-shape-grid-compact{
        grid-template-columns:repeat(auto-fill,52px)!important;
        justify-content:start!important;
        gap:7px 6px!important;
      }

      #akis-studio .ae-shape{
        width:52px!important;
        min-width:52px!important;
        max-width:52px!important;
        height:62px!important;
        min-height:62px!important;
      }

      #akis-studio .shape-preview.circuit-symbol{
        display:grid;
        width:42px;
        height:28px;
        place-items:center;
        border:0;
        color:currentColor;
        background:transparent;
        font-family:Consolas,"Courier New",monospace;
        font-size:13px;
        font-weight:700;
        letter-spacing:-1px;
        white-space:nowrap;
      }
    `;

    document.head.append(style);
  };

  const button=(type,label,symbol)=>{
    return `
      <button
        class="ae-shape"
        type="button"
        draggable="true"
        data-shape="${type}"
        aria-label="${label}"
      >
        <span class="shape-preview circuit-symbol">${symbol}</span>
        <span>${label}</span>
      </button>
    `;
  };

  const installLibraries=()=>{
    const saved=A.$(".ae-saved-section");

    if(!saved||A.$(".ae-library-electronics")){
      return;
    }

    saved.insertAdjacentHTML("beforebegin",`
      <details class="ae-library ae-library-electronics" open>
        <summary>Elektronik <span>⌃</span></summary>

        <div class="ae-shape-grid ae-shape-grid-compact">
          ${button("resistor","Direnç","—/\\/—")}
          ${button("capacitor","Kondans.","—| |—")}
          ${button("inductor","Bobin","—∿∿—")}
          ${button("diode","Diyot","—▷|—")}
          ${button("led","LED","▷| ↗")}
          ${button("transistor-npn","NPN","NPN")}
          ${button("transistor-pnp","PNP","PNP")}
          ${button("opamp","Op-Amp","▷")}
          ${button("ground","GND","⏚")}
          ${button("vcc","VCC","↑")}
          ${button("battery","Pil","—|‖—")}
          ${button("switch","Anahtar","—/ —")}
        </div>
      </details>

      <details class="ae-library ae-library-electric" open>
        <summary>Elektrik <span>⌃</span></summary>

        <div class="ae-shape-grid ae-shape-grid-compact">
          ${button("motor","Motor","Ⓜ")}
          ${button("lamp","Lamba","⊗")}
          ${button("fuse","Sigorta","—▭—")}
          ${button("relay","Röle","RLY")}
          ${button("transformer","Trafo","∿‖∿")}
          ${button("voltmeter","Voltmetre","Ⓥ")}
          ${button("ammeter","Ampermetre","Ⓐ")}
          ${button("ac-source","AC kaynak","∿")}
          ${button("dc-source","DC kaynak","⎓")}
        </div>
      </details>
    `);

    const shortcuts=A.$(".ae-shortcuts");

    if(
      shortcuts&&
      !shortcuts.textContent.includes("toplu seç")
    ){
      shortcuts.insertAdjacentHTML(
        "beforeend",
        `
          <span>Boş alanda sürükle: toplu seç</span>
          <span>Shift + tık: seçime ekle/çıkar</span>
          <span>Ctrl + iki kutu: otomatik bağla</span>
          <span>Ok uçlarını sürükle: bağlantıyı taşı</span>
        `
      );
    }
  };

  const clampWidth=(value)=>{
    return Math.min(
      MAX_WIDTH,
      Math.max(
        MIN_WIDTH,
        Math.round(value)
      )
    );
  };

  A.setPaletteWidth=(value,persist=true)=>{
    const width=clampWidth(value);

    A.root.style.setProperty(
      "--ae-palette-width",
      `${width}px`
    );

    A.$("#ae-palette-resizer")
      .setAttribute(
        "aria-valuenow",
        String(width)
      );

    if(persist){
      try{
        localStorage.setItem(
          A.keys.paletteWidth,
          String(width)
        );
      }catch{}
    }

    return width;
  };

  A.setPaletteCollapsed=(
    collapsed,
    persist=true
  )=>{
    A.root.classList.toggle(
      "palette-collapsed",
      Boolean(collapsed)
    );

    A.$("#ae-collapse-palette")
      .setAttribute(
        "aria-expanded",
        String(!collapsed)
      );

    A.$("#ae-open-palette")
      .setAttribute(
        "aria-expanded",
        String(!collapsed)
      );

    if(persist){
      try{
        localStorage.setItem(
          A.keys.paletteCollapsed,
          String(Boolean(collapsed))
        );
      }catch{}
    }
  };

  A.togglePalette=()=>{
    const collapsed=
      !A.root.classList.contains(
        "palette-collapsed"
      );

    A.setPaletteCollapsed(collapsed);

    A.setStatus(
      collapsed
        ? "Şekil paneli kapatıldı"
        : "Şekil paneli açıldı"
    );
  };

  A.renderSavedShapes=()=>{
    const container=A.$(
      "#ae-saved-shapes"
    );

    container.replaceChildren();

    if(!A.runtime.savedShapes.length){
      const empty=
        document.createElement("p");

      empty.className=
        "text-small text-muted ae-empty-saved";

      empty.textContent="Henüz kayıt yok";
      container.append(empty);

      return;
    }

    A.runtime.savedShapes.forEach(
      (shape,index)=>{
        const item=
          document.createElement("button");

        item.type="button";
        item.className="ae-shape";

        item.setAttribute(
          "aria-label",
          `Kaydedilen şekil ${index+1}`
        );

        const preview=
          document.createElement("span");

        preview.className=
          `shape-preview ${
            shape.type==="ellipse"
              ? "ellipse"
              : shape.type==="diamond"
                ? "diamond"
                : "rect"
          }`;

        preview.style.background=shape.fill;
        preview.style.borderColor=shape.stroke;

        const label=
          document.createElement("span");

        label.textContent=
          shape.text||shape.type;

        item.append(preview,label);

        item.addEventListener(
          "click",
          ()=>{
            A.addAtCenter(
              shape.type,
              shape.text,
              shape
            );
          }
        );

        container.append(item);
      }
    );
  };

  A.saveSelectedShape=()=>{
    const node=
      A.selectedNodeObjects()[0];

    if(!node){
      A.setStatus(
        "Önce kaydetmek istediğin şekli seç"
      );
      return;
    }

    const saved={...node};

    [
      "id",
      "x",
      "y",
      "w",
      "h"
    ].forEach((property)=>{
      delete saved[property];
    });

    A.runtime.savedShapes.push(saved);

    if(A.runtime.savedShapes.length>12){
      A.runtime.savedShapes.shift();
    }

    localStorage.setItem(
      A.keys.shapes,
      JSON.stringify(
        A.runtime.savedShapes
      )
    );

    A.renderSavedShapes();

    A.setStatus(
      "Şekil kütüphaneye kaydedildi"
    );
  };

  A.filterShapes=(query)=>{
    const term=query
      .trim()
      .toLocaleLowerCase("tr-TR");

    A.$$(".ae-shape[data-shape]")
      .forEach((item)=>{
        const label=(
          item.getAttribute("aria-label")||
          item.textContent||
          ""
        ).toLocaleLowerCase("tr-TR");

        item.hidden=
          Boolean(term)&&
          !label.includes(term);
      });
  };

  const bindShapeButtons=()=>{
    A.$$("[data-shape]")
      .forEach((item)=>{
        item.addEventListener(
          "dragstart",
          (event)=>{
            event.dataTransfer.setData(
              "application/x-akis-shape",
              item.dataset.shape
            );

            event.dataTransfer.effectAllowed=
              "copy";
          }
        );

        item.addEventListener(
          "click",
          ()=>{
            A.addAtCenter(
              item.dataset.shape,
              A.defaultShapeText[
                item.dataset.shape
              ]??"Yeni kutu"
            );
          }
        );
      });
  };

  const bindResizer=()=>{
    const resizer=A.$(
      "#ae-palette-resizer"
    );

    resizer.addEventListener(
      "pointerdown",
      (event)=>{
        if(event.button!==0){
          return;
        }

        event.preventDefault();

        const current=
          parseFloat(
            getComputedStyle(A.root)
              .getPropertyValue(
                "--ae-palette-width"
              )
          )||DEFAULT_WIDTH;

        A.runtime.paletteResize={
          pointerId:event.pointerId,
          startX:event.clientX,
          startWidth:current,
          rawWidth:current
        };

        A.root.classList.add(
          "palette-resizing"
        );

        resizer.setPointerCapture(
          event.pointerId
        );
      }
    );

    resizer.addEventListener(
      "pointermove",
      (event)=>{
        const resize=
          A.runtime.paletteResize;

        if(
          !resize||
          resize.pointerId!==
            event.pointerId
        ){
          return;
        }

        resize.rawWidth=
          resize.startWidth+
          event.clientX-
          resize.startX;

        A.setPaletteWidth(
          resize.rawWidth,
          false
        );
      }
    );

    const finish=(event)=>{
      const resize=
        A.runtime.paletteResize;

      if(
        !resize||
        resize.pointerId!==
          event.pointerId
      ){
        return;
      }

      A.runtime.paletteResize=null;

      A.root.classList.remove(
        "palette-resizing"
      );

      if(
        resizer.hasPointerCapture(
          event.pointerId
        )
      ){
        resizer.releasePointerCapture(
          event.pointerId
        );
      }

      if(resize.rawWidth<150){
        A.setPaletteCollapsed(true);

        A.setStatus(
          "Şekil paneli kapatıldı"
        );

        return;
      }

      const width=A.setPaletteWidth(
        resize.rawWidth
      );

      A.setStatus(
        `Panel genişliği: ${width} px`
      );
    };

    resizer.addEventListener(
      "pointerup",
      finish
    );

    resizer.addEventListener(
      "pointercancel",
      finish
    );

    resizer.addEventListener(
      "dblclick",
      ()=>{
        const width=A.setPaletteWidth(
          DEFAULT_WIDTH
        );

        A.setStatus(
          `Panel genişliği sıfırlandı: ${width} px`
        );
      }
    );

    resizer.addEventListener(
      "keydown",
      (event)=>{
        let width=
          Number(
            resizer.getAttribute(
              "aria-valuenow"
            )
          )||DEFAULT_WIDTH;

        if(event.key==="ArrowLeft"){
          width-=event.shiftKey ? 32 : 8;
        }else if(event.key==="ArrowRight"){
          width+=event.shiftKey ? 32 : 8;
        }else if(event.key==="Home"){
          width=MIN_WIDTH;
        }else if(event.key==="End"){
          width=MAX_WIDTH;
        }else{
          return;
        }

        event.preventDefault();
        A.setPaletteWidth(width);
      }
    );
  };

  A.registerSidebar=()=>{
    installStyles();
    installLibraries();
    bindShapeButtons();
    bindResizer();

    A.$("#ae-collapse-palette")
      .addEventListener(
        "click",
        A.togglePalette
      );

    A.$("#ae-open-palette")
      .addEventListener(
        "click",
        A.togglePalette
      );

    A.$("#ae-shape-search")
      .addEventListener(
        "input",
        (event)=>{
          A.filterShapes(
            event.target.value
          );
        }
      );

    A.$("#ae-save-shape")
      .addEventListener(
        "click",
        A.saveSelectedShape
      );

    A.$("#ae-more-shapes")
      .addEventListener(
        "click",
        ()=>{
          A.$$(".ae-library")
            .forEach((details)=>{
              details.open=true;
            });

          A.setStatus(
            "Tüm yerleşik şekiller açıldı"
          );
        }
      );
  };
})();