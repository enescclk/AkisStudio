(() => {
  "use strict";

  const A=window.AkisStudio;

  const installLineWidthControl=()=>{
    const old=A.$("#ae-line-width");

    if(
      !old||
      A.$("#ae-line-width-slider")
    ){
      return;
    }

    const value=Math.max(
      .5,
      Math.min(
        50,
        Number(old.value)||2
      )
    );

    const control=
      document.createElement("div");

    control.className=
      "ae-line-width-control";

    control.title="Çizgi kalınlığı";

    control.innerHTML=`
      <input
        id="ae-line-width-slider"
        type="range"
        min="0.5"
        max="20"
        step="0.5"
        value="${Math.min(20,value)}"
        aria-label="Çizgi kalınlığı sürgüsü"
      >

      <label class="ae-line-width-number">
        <input
          id="ae-line-width"
          class="form-control"
          type="number"
          min="0.5"
          max="50"
          step="0.5"
          value="${value}"
          aria-label="Çizgi kalınlığını elle gir"
        >
        <span>px</span>
      </label>
    `;

    old.replaceWith(control);

    const style=
      document.createElement("style");

    style.id=
      "ae-modular-toolbar-styles";

    style.textContent=`
      #akis-studio .ae-line-width-control{
        display:inline-flex;
        flex:0 0 auto;
        align-items:center;
        gap:6px;
        height:34px;
        padding:0 7px;
        border:1px solid var(--glass-edge);
        border-radius:9px;
        background:var(--glass-soft);
      }

      #akis-studio .ae-line-width-control input[type=range]{
        width:clamp(72px,7vw,112px);
        margin:0;
        accent-color:var(--primary);
        cursor:pointer;
      }

      #akis-studio .ae-line-width-number{
        display:inline-flex;
        align-items:center;
        gap:2px;
        color:var(--muted-foreground);
        font-size:11px;
      }

      #akis-studio .ae-line-width-number input{
        width:54px;
        height:26px;
        padding:3px 4px;
        border:0;
        background:transparent;
        box-shadow:none;
        text-align:right;
        font-variant-numeric:tabular-nums;
      }
    `;

    document.head.append(style);

    const strokeLabel=
      A.$("#ae-stroke")
        ?.closest("label");

    if(strokeLabel){
      strokeLabel.setAttribute(
        "aria-label",
        "Şekil veya seçili bağlantı rengi"
      );

      strokeLabel.title=
        "Şekil ya da seçili okun rengini değiştir";
    }
  };

  A.closeDropdowns=(except)=>{
    A.$$(".ae-dropdown[open]")
      .forEach((details)=>{
        if(details!==except){
          details.removeAttribute("open");
        }
      });
  };

  A.syncLineWidthControls=(value)=>{
    const width=Math.max(
      .5,
      Math.min(
        50,
        Number(value)||1
      )
    );

    A.$("#ae-line-width").value=
      String(width);

    A.$("#ae-line-width-slider").value=
      String(Math.min(20,width));
  };

  A.updateToolbar=()=>{
    const node=
      A.selectedNodeObjects()[0]||
      null;

    const edge=A.getEdge(
      A.state.selectedEdge
    );

    [
      "#ae-fill",
      "#ae-text-color",
      "#ae-font-size",
      "#ae-font-family",
      "#ae-bold",
      "#ae-italic",
      "#ae-underline"
    ].forEach((selector)=>{
      A.$(selector).disabled=!node;
    });

    [
      "#ae-start-arrow",
      "#ae-end-arrow",
      "#ae-endpoint-size"
    ].forEach((selector)=>{
      A.$(selector).disabled=!edge;
    });

    [
      "#ae-stroke",
      "#ae-line-width",
      "#ae-line-width-slider",
      "#ae-corner-radius"
    ].forEach((selector)=>{
      A.$(selector).disabled=
        !node&&!edge;
    });

    if(!node){
      [
        "#ae-bold",
        "#ae-italic",
        "#ae-underline"
      ].forEach((selector)=>{
        A.$(selector).setAttribute(
          "aria-pressed",
          "false"
        );
      });

      A.$$(
        "[data-text-align],"+
        "[data-vertical-align]"
      ).forEach((item)=>{
        item.setAttribute(
          "aria-pressed",
          "false"
        );
      });
    }

    if(!edge){
      A.$$(
        "[data-line-style],"+
        "[data-routing]"
      ).forEach((item)=>{
        item.setAttribute(
          "aria-pressed",
          "false"
        );
      });
    }

    if(node){
      A.$("#ae-fill").value=
        node.fill;

      A.$("#ae-stroke").value=
        node.stroke;

      A.$("#ae-text-color").value=
        node.textColor;

      A.$("#ae-font-size").value=
        String(node.fontSize);

      A.$("#ae-font-family").value=
        node.fontFamily||
        A.defaults.node.fontFamily;

      A.syncLineWidthControls(
        node.strokeWidth||1.5
      );

      A.$("#ae-corner-radius").value=
        String(node.cornerRadius||0);

      [
        ["#ae-bold",node.bold],
        ["#ae-italic",node.italic],
        ["#ae-underline",node.underline]
      ].forEach(([selector,value])=>{
        A.$(selector).setAttribute(
          "aria-pressed",
          String(Boolean(value))
        );
      });

      A.$$("[data-text-align]")
        .forEach((item)=>{
          item.setAttribute(
            "aria-pressed",
            String(
              item.dataset.textAlign===
              node.textAlign
            )
          );
        });

      A.$$("[data-vertical-align]")
        .forEach((item)=>{
          item.setAttribute(
            "aria-pressed",
            String(
              item.dataset.verticalAlign===
              node.verticalAlign
            )
          );
        });
    }

    if(edge){
      A.$("#ae-stroke").value=
        edge.color||
        A.defaults.edge.color;

      A.syncLineWidthControls(
        edge.width||2
      );

      A.$("#ae-corner-radius").value=
        String(edge.cornerRadius||0);

      A.$("#ae-start-arrow").value=
        edge.startArrow||"none";

      A.$("#ae-end-arrow").value=
        edge.endArrow||"arrow";

      A.$("#ae-endpoint-size").value=
        String(edge.endpointSize||1);

      A.$$("[data-line-style]")
        .forEach((item)=>{
          item.setAttribute(
            "aria-pressed",
            String(
              item.dataset.lineStyle===
              edge.lineStyle
            )
          );
        });

      A.$$("[data-routing]")
        .forEach((item)=>{
          item.setAttribute(
            "aria-pressed",
            String(
              item.dataset.routing===
              edge.routing
            )
          );
        });

      const sample=A.$(
        "#ae-line-menu summary .ae-line-sample"
      );

      sample.className=
        `ae-line-sample ${
          edge.lineStyle||"solid"
        }`;
    }

    if(!node&&!edge){
      A.syncLineWidthControls(2);
    }

    A.$("#ae-connect")
      .setAttribute(
        "aria-pressed",
        String(A.state.connectMode)
      );

    A.$("#ae-grid-toggle")
      .setAttribute(
        "aria-pressed",
        String(A.state.grid)
      );

    A.$("#ae-grid").style.display=
      A.state.grid ? "" : "none";

    A.$("#ae-undo").disabled=
      !A.state.undo.length;

    A.$("#ae-redo").disabled=
      !A.state.redo.length;

    A.svg.classList.toggle(
      "is-connect",
      A.state.connectMode
    );

    const hint=A.$("#ae-connect-hint");

    hint.hidden=!A.state.connectMode;

    hint.textContent=
      A.state.connectSource
        ? "Bağlanacak ikinci kutuyu seç"
        : "İlk kutuyu seç";
  };

  A.setTheme=(
    theme,
    notifyDesktop=true
  )=>{
    const selected=[
      "system",
      "light",
      "dark"
    ].includes(theme)
      ? theme
      : "system";

    if(selected==="system"){
      document.documentElement
        .removeAttribute("data-theme");
    }else{
      document.documentElement
        .dataset.theme=selected;
    }

    A.$("#ae-theme").value=selected;

    localStorage.setItem(
      A.keys.theme,
      selected
    );

    if(notifyDesktop){
      window.desktopAPI?.setTheme(selected);
    }

    A.setStatus(
      `Tema: ${
        selected==="dark"
          ? "Koyu"
          : selected==="light"
            ? "Açık"
            : "Sistem"
      }`
    );
  };

  const bindLineWidth=()=>{
    const begin=()=>{
      if(
        A.runtime.lineWidthGesture||
        (
          !A.selectedNodeIds().length&&
          !A.state.selectedEdge
        )
      ){
        return;
      }

      A.pushHistory();
      A.runtime.lineWidthGesture=true;
    };

    const finish=()=>{
      if(!A.runtime.lineWidthGesture){
        return;
      }

      A.runtime.lineWidthGesture=false;
      A.scheduleSave();
    };

    const slider=A.$(
      "#ae-line-width-slider"
    );

    const number=A.$(
      "#ae-line-width"
    );

    slider.addEventListener(
      "pointerdown",
      begin
    );

    slider.addEventListener(
      "keydown",
      begin
    );

    slider.addEventListener(
      "input",
      (event)=>{
        A.updateLineWidth(
          event.target.value,
          {
            history:false,
            save:false
          }
        );
      }
    );

    slider.addEventListener(
      "change",
      finish
    );

    slider.addEventListener(
      "blur",
      finish
    );

    number.addEventListener(
      "input",
      (event)=>{
        if(event.target.value!==""){
          begin();

          A.updateLineWidth(
            event.target.value,
            {
              history:false,
              save:false
            }
          );
        }
      }
    );

    number.addEventListener(
      "change",
      finish
    );

    number.addEventListener(
      "blur",
      finish
    );

    number.addEventListener(
      "keydown",
      (event)=>{
        if(event.key==="Enter"){
          event.target.blur();
        }
      }
    );
  };

  A.registerToolbar=()=>{
    installLineWidthControl();
    bindLineWidth();

    A.$("#ae-undo")
      .addEventListener(
        "click",
        A.undo
      );

    A.$("#ae-redo")
      .addEventListener(
        "click",
        A.redo
      );

    A.$("#ae-fill")
      .addEventListener(
        "change",
        (event)=>{
          A.updateSelected(
            "fill",
            event.target.value
          );
        }
      );

    A.$("#ae-stroke")
      .addEventListener(
        "change",
        (event)=>{
          A.updateStroke(
            event.target.value
          );
        }
      );

    A.$("#ae-text-color")
      .addEventListener(
        "change",
        (event)=>{
          A.updateSelected(
            "textColor",
            event.target.value
          );
        }
      );

    A.$("#ae-font-size")
      .addEventListener(
        "change",
        (event)=>{
          A.updateSelected(
            "fontSize",
            Number(event.target.value)
          );
        }
      );

    A.$("#ae-font-family")
      .addEventListener(
        "change",
        (event)=>{
          A.updateSelected(
            "fontFamily",
            event.target.value
          );
        }
      );

    A.$("#ae-bold")
      .addEventListener(
        "click",
        ()=>{
          const node=
            A.selectedNodeObjects()[0];

          if(node){
            A.updateSelected(
              "bold",
              !node.bold
            );
          }
        }
      );

    A.$("#ae-italic")
      .addEventListener(
        "click",
        ()=>{
          const node=
            A.selectedNodeObjects()[0];

          if(node){
            A.updateSelected(
              "italic",
              !node.italic
            );
          }
        }
      );

    A.$("#ae-underline")
      .addEventListener(
        "click",
        ()=>{
          const node=
            A.selectedNodeObjects()[0];

          if(node){
            A.updateSelected(
              "underline",
              !node.underline
            );
          }
        }
      );

    A.$("#ae-corner-radius")
      .addEventListener(
        "change",
        (event)=>{
          A.updateCornerRadius(
            Number(event.target.value)
          );
        }
      );

    A.$("#ae-start-arrow")
      .addEventListener(
        "change",
        (event)=>{
          A.updateEdge(
            "startArrow",
            event.target.value
          );
        }
      );

    A.$("#ae-end-arrow")
      .addEventListener(
        "change",
        (event)=>{
          A.updateEdge(
            "endArrow",
            event.target.value
          );
        }
      );

    A.$("#ae-endpoint-size")
      .addEventListener(
        "change",
        (event)=>{
          A.updateEdge(
            "endpointSize",
            Number(event.target.value)
          );
        }
      );

    A.$$("[data-text-align]")
      .forEach((item)=>{
        item.addEventListener(
          "click",
          ()=>{
            A.updateSelected(
              "textAlign",
              item.dataset.textAlign
            );

            A.closeDropdowns();
          }
        );
      });

    A.$$("[data-vertical-align]")
      .forEach((item)=>{
        item.addEventListener(
          "click",
          ()=>{
            A.updateSelected(
              "verticalAlign",
              item.dataset.verticalAlign
            );

            A.closeDropdowns();
          }
        );
      });

    A.$$("[data-line-style]")
      .forEach((item)=>{
        item.addEventListener(
          "click",
          ()=>{
            A.updateEdge(
              "lineStyle",
              item.dataset.lineStyle
            );

            A.closeDropdowns();
          }
        );
      });

    A.$$("[data-routing]")
      .forEach((item)=>{
        item.addEventListener(
          "click",
          ()=>{
            A.updateEdge(
              "routing",
              item.dataset.routing
            );

            A.closeDropdowns();
          }
        );
      });

    A.$("#ae-connect")
      .addEventListener(
        "click",
        ()=>{
          A.state.connectMode=
            !A.state.connectMode;

          A.state.connectSource=null;
          A.updateToolbar();
        }
      );

    A.$("#ae-layout")
      .addEventListener(
        "click",
        A.autoLayout
      );

    A.$("#ae-grid-toggle")
      .addEventListener(
        "click",
        ()=>{
          A.state.grid=!A.state.grid;
          A.render();
          A.scheduleSave();
        }
      );

    A.$("#ae-snap")
      .addEventListener(
        "change",
        (event)=>{
          A.state.snap=
            event.target.checked;

          A.scheduleSave();
        }
      );

    A.$("#ae-zoom-in")
      .addEventListener(
        "click",
        ()=>{
          A.zoomAt(1.18);
        }
      );

    A.$("#ae-zoom-out")
      .addEventListener(
        "click",
        ()=>{
          A.zoomAt(.84);
        }
      );

    A.$("#ae-zoom-label")
      .addEventListener(
        "click",
        ()=>{
          A.state.zoom=1;
          A.updateTransform();
        }
      );

    A.$("#ae-fit")
      .addEventListener(
        "click",
        A.fitDiagram
      );

    A.$$(".ae-dropdown")
      .forEach((details)=>{
        details.addEventListener(
          "toggle",
          ()=>{
            if(details.open){
              A.closeDropdowns(details);
            }
          }
        );
      });

    document.addEventListener(
      "pointerdown",
      (event)=>{
        if(
          !event.target.closest(
            ".ae-dropdown"
          )
        ){
          A.closeDropdowns();
        }
      }
    );

    A.$("#ae-theme")
      .addEventListener(
        "change",
        (event)=>{
          A.setTheme(
            event.target.value
          );
        }
      );
  };
})();