(() => {
  "use strict";

  const A=window.AkisStudio;

  const installExportButtons=()=>{
    const options=A.$(".ae-export-options");

    if(!options||A.$("#ae-export-jpeg")){
      return;
    }

    A.$("#ae-export-png")
      ?.classList.remove("btn-primary");

    options.insertAdjacentHTML(
      "beforeend",
      `
        <button type="button" class="btn" id="ae-export-jpeg">
          <span class="ae-glyph">▧</span>
          JPEG indir
        </button>

        <button type="button" class="btn btn-primary" id="ae-export-pdf">
          <span class="ae-glyph">▤</span>
          PDF indir
        </button>
      `
    );

    const style=
      document.createElement("style");

    style.textContent=`
      #akis-studio .ae-export-options{
        flex-wrap:wrap;
      }
    `;

    document.head.append(style);
  };

  A.safeName=(extension)=>{
    const name=A.state.name
      .trim()
      .replace(/[\\/:*?"<>|]+/g,"-")
      .replace(/\s+/g,"-")
      .toLowerCase()||
      "diyagram";

    return `${name}.${extension}`;
  };

  A.downloadBlob=(blob,filename)=>{
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");

    link.href=url;
    link.download=filename;

    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(()=>{
      URL.revokeObjectURL(url);
    },500);
  };

  A.exportBounds=()=>{
    if(!A.state.nodes.length){
      return {
        x:0,
        y:0,
        w:800,
        h:500
      };
    }

    const padding=45;

    const minX=Math.min(
      ...A.state.nodes.map(
        (node)=>node.x
      )
    )-padding;

    const minY=Math.min(
      ...A.state.nodes.map(
        (node)=>node.y
      )
    )-padding;

    const maxX=Math.max(
      ...A.state.nodes.map(
        (node)=>node.x+node.w
      )
    )+padding;

    const maxY=Math.max(
      ...A.state.nodes.map(
        (node)=>node.y+node.h
      )
    )+padding;

    return {
      x:minX,
      y:minY,
      w:maxX-minX,
      h:maxY-minY
    };
  };

  A.buildExportSvg=()=>{
    const bounds=A.exportBounds();

    const copy=document.createElementNS(
      A.ns,
      "svg"
    );

    copy.setAttribute("xmlns",A.ns);
    copy.setAttribute("width",bounds.w);
    copy.setAttribute("height",bounds.h);

    copy.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} `+
      `${bounds.w} ${bounds.h}`
    );

    copy.setAttribute(
      "style",
      "--ae-canvas:#ffffff"
    );

    const definitions=
      A.svg
        .querySelector("defs")
        .cloneNode(true);

    copy.append(definitions);

    copy.append(
      A.el("rect",{
        x:bounds.x,
        y:bounds.y,
        width:bounds.w,
        height:bounds.h,
        fill:"#ffffff"
      })
    );

    const edges=
      A.edgesLayer.cloneNode(true);

    edges
      .querySelectorAll(".ae-edge-hit")
      .forEach((node)=>{
        node.remove();
      });

    edges
      .querySelectorAll(".selected")
      .forEach((node)=>{
        node.classList.remove("selected");
      });

    const nodes=
      A.nodesLayer.cloneNode(true);

    copy.append(edges,nodes);

    const style=document.createElementNS(
      A.ns,
      "style"
    );

    style.textContent=`
      .ae-edge{
        fill:none;
      }

      .ae-node-text{
        dominant-baseline:middle;
      }
    `;

    copy.insertBefore(
      style,
      copy.firstChild
    );

    return new XMLSerializer()
      .serializeToString(copy);
  };

  const exportSvg=()=>{
    const source=A.buildExportSvg();

    const blob=new Blob(
      [source],
      {
        type:"image/svg+xml;charset=utf-8"
      }
    );

    A.downloadBlob(
      blob,
      A.safeName("svg")
    );

    A.$("#ae-export-dialog").close();
    A.setStatus("SVG indirildi");
  };

  const renderCanvas=()=>{
    return new Promise(
      (resolve,reject)=>{
        const source=
          A.buildExportSvg();

        const bounds=
          A.exportBounds();

        const image=new Image();

        const url=URL.createObjectURL(
          new Blob(
            [source],
            {
              type:"image/svg+xml"
            }
          )
        );

        image.onload=()=>{
          const scale=Math.min(
            3,
            Math.max(
              1,
              2800/
              Math.max(
                bounds.w,
                bounds.h
              )
            )
          );

          const canvas=
            document.createElement(
              "canvas"
            );

          canvas.width=Math.ceil(
            bounds.w*scale
          );

          canvas.height=Math.ceil(
            bounds.h*scale
          );

          const context=
            canvas.getContext("2d");

          context.fillStyle="#ffffff";

          context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          URL.revokeObjectURL(url);
          resolve(canvas);
        };

        image.onerror=()=>{
          URL.revokeObjectURL(url);

          reject(
            new Error(
              "Diyagram görseli oluşturulamadı"
            )
          );
        };

        image.src=url;
      }
    );
  };

  const canvasBlob=(
    canvas,
    type,
    quality
  )=>{
    return new Promise(
      (resolve,reject)=>{
        canvas.toBlob(
          (blob)=>{
            if(blob){
              resolve(blob);
            }else{
              reject(
                new Error(
                  "Görsel kodlanamadı"
                )
              );
            }
          },
          type,
          quality
        );
      }
    );
  };

  const exportBitmap=async(type)=>{
    A.$("#ae-export-dialog").close();

    try{
      const canvas=
        await renderCanvas();

      const isJpeg=
        type==="jpeg";

      const blob=
        await canvasBlob(
          canvas,
          isJpeg
            ? "image/jpeg"
            : "image/png",
          .92
        );

      A.downloadBlob(
        blob,
        A.safeName(
          isJpeg ? "jpg" : "png"
        )
      );

      A.setStatus(
        `${isJpeg ? "JPEG" : "PNG"} indirildi`
      );
    }catch{
      A.setStatus(
        `${type.toUpperCase()} oluşturulamadı`
      );
    }
  };

  const buildPdf=(
    jpegBytes,
    imageWidth,
    imageHeight
  )=>{
    const landscape=
      imageWidth>=imageHeight;

    const pageWidth=
      landscape ? 842 : 595;

    const pageHeight=
      landscape ? 595 : 842;

    const margin=28;

    const scale=Math.min(
      (pageWidth-margin*2)/imageWidth,
      (pageHeight-margin*2)/imageHeight
    );

    const drawWidth=
      imageWidth*scale;

    const drawHeight=
      imageHeight*scale;

    const drawX=
      (pageWidth-drawWidth)/2;

    const drawY=
      (pageHeight-drawHeight)/2;

    const content=
      `q\n`+
      `${drawWidth.toFixed(2)} 0 0 `+
      `${drawHeight.toFixed(2)} `+
      `${drawX.toFixed(2)} `+
      `${drawY.toFixed(2)} cm\n`+
      `/Im0 Do\n`+
      `Q`;

    const encoder=new TextEncoder();
    const chunks=[];
    const offsets=[0];

    let length=0;

    const append=(bytes)=>{
      chunks.push(bytes);
      length+=bytes.length;
    };

    const appendText=(value)=>{
      append(encoder.encode(value));
    };

    const begin=(id)=>{
      offsets[id]=length;
      appendText(`${id} 0 obj\n`);
    };

    const end=()=>{
      appendText("\nendobj\n");
    };

    appendText("%PDF-1.4\n");

    append(
      new Uint8Array([
        0x25,
        0xe2,
        0xe3,
        0xcf,
        0xd3,
        0x0a
      ])
    );

    begin(1);
    appendText(
      "<< /Type /Catalog /Pages 2 0 R >>"
    );
    end();

    begin(2);
    appendText(
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
    );
    end();

    begin(3);
    appendText(
      `<< /Type /Page `+
      `/Parent 2 0 R `+
      `/MediaBox [0 0 ${pageWidth} ${pageHeight}] `+
      `/Resources << `+
      `/XObject << /Im0 4 0 R >> `+
      `>> `+
      `/Contents 5 0 R >>`
    );
    end();

    begin(4);
    appendText(
      `<< /Type /XObject `+
      `/Subtype /Image `+
      `/Width ${imageWidth} `+
      `/Height ${imageHeight} `+
      `/ColorSpace /DeviceRGB `+
      `/BitsPerComponent 8 `+
      `/Filter /DCTDecode `+
      `/Length ${jpegBytes.length} `+
      `>>\nstream\n`
    );

    append(jpegBytes);
    appendText("\nendstream");
    end();

    const contentBytes=
      encoder.encode(content);

    begin(5);

    appendText(
      `<< /Length ${contentBytes.length} >>\n`+
      `stream\n`
    );

    append(contentBytes);
    appendText("\nendstream");
    end();

    const xref=length;

    appendText(
      "xref\n"+
      "0 6\n"+
      "0000000000 65535 f \n"
    );

    for(let id=1;id<=5;id+=1){
      appendText(
        `${String(offsets[id]).padStart(10,"0")} `+
        `00000 n \n`
      );
    }

    appendText(
      `trailer\n`+
      `<< /Size 6 /Root 1 0 R >>\n`+
      `startxref\n`+
      `${xref}\n`+
      `%%EOF`
    );

    return new Blob(
      chunks,
      {
        type:"application/pdf"
      }
    );
  };

  const exportPdf=async()=>{
    A.$("#ae-export-dialog").close();

    try{
      const canvas=
        await renderCanvas();

      const jpeg=
        await canvasBlob(
          canvas,
          "image/jpeg",
          .94
        );

      const bytes=
        new Uint8Array(
          await jpeg.arrayBuffer()
        );

      const pdf=buildPdf(
        bytes,
        canvas.width,
        canvas.height
      );

      A.downloadBlob(
        pdf,
        A.safeName("pdf")
      );

      A.setStatus("PDF indirildi");
    }catch{
      A.setStatus(
        "PDF oluşturulamadı"
      );
    }
  };

  A.registerExport=()=>{
    installExportButtons();

    A.$("#ae-export")
      .addEventListener(
        "click",
        ()=>{
          A.$("#ae-export-dialog")
            .showModal();
        }
      );

    A.$("#ae-export-svg")
      .addEventListener(
        "click",
        exportSvg
      );

    A.$("#ae-export-png")
      .addEventListener(
        "click",
        ()=>{
          exportBitmap("png");
        }
      );

    A.$("#ae-export-jpeg")
      .addEventListener(
        "click",
        ()=>{
          exportBitmap("jpeg");
        }
      );

    A.$("#ae-export-pdf")
      .addEventListener(
        "click",
        exportPdf
      );
  };
})();